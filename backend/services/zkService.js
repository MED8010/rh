const ZKLib = require('node-zklib');
const Employe = require('../models/Employe');
const Pointage = require('../models/Pointage');
const ZkLog = require('../models/ZkLog');
const BiometricDevice = require('../models/BiometricDevice');

let isSyncActive = true;

const toggleSync = (status) => {
  if (status !== undefined) {
    isSyncActive = !!status;
  } else {
    isSyncActive = !isSyncActive;
  }
  return isSyncActive;
};

const getSyncStatus = () => isSyncActive;

const syncLogs = async () => {
  if (!isSyncActive) {
    console.log('⏹️ Biometric Sync is currently disabled.');
    return { status: 'disabled' };
  }
  
  const devices = await BiometricDevice.find({ isActive: true });
  if (devices.length === 0) {
    console.log('⚠️ No active biometric devices configured.');
    return { success: 0, failed: 0, deviceStatus: [], message: 'Aucune pointeuse configurée' };
  }

  console.log(`🕒 Starting Biometric Sync for ${devices.length} devices:`, new Date().toLocaleString());
  const summary = { success: 0, failed: 0, deviceStatus: [] };

  for (const deviceInfo of devices) {
    let zkInstance;
    try {
      zkInstance = new ZKLib(deviceInfo.ip, deviceInfo.port || 4370, 10000, 4000);
      console.log(`📡 Attempting connection to ${deviceInfo.name} (${deviceInfo.ip})...`);
      
      await zkInstance.createSocket();
      console.log(`✅ Connected to ${deviceInfo.name} (${deviceInfo.ip})`);

      // Get users and logs before processing
      const users = await zkInstance.getUsers();
      const logs = await zkInstance.getAttendance();
      
      if (!logs || !logs.data) {
        throw new Error('No log data received from device');
      }
      
      console.log(`📊 Found ${logs.data.length} logs on ${deviceInfo.name}`);
      let syncedCount = 0;

      for (const log of logs.data) {
        try {
          const matricule = log.deviceUserId;
          const timestamp = new Date(log.recordTime);
          const dateStr = timestamp.toISOString().split('T')[0];
          const timeStr = timestamp.toTimeString().split(' ')[0];

          const employe = await Employe.findOne({ matricule });
          if (!employe) continue;

          const existing = await Pointage.findOne({
            employe: employe._id,
            zk_timestamp: timestamp
          });

          if (existing) continue;

          let pointage = await Pointage.findOne({
            employe: employe._id,
            date: new Date(dateStr)
          });

          if (!pointage) {
            pointage = new Pointage({
              employe: employe._id,
              date: new Date(dateStr),
              heure_entree: timeStr,
              source: 'biometric',
              zk_timestamp: timestamp
            });
          } else {
            if (!pointage.heure_sortie || timeStr > pointage.heure_sortie) {
               pointage.heure_sortie = timeStr;
            }
            if (timeStr < pointage.heure_entree) {
               pointage.heure_entree = timeStr;
            }
            pointage.zk_timestamp = timestamp;
            pointage.source = 'biometric';
          }

          // Recalculate late minutes and worked hours
          if (pointage.heure_entree) {
            const entryTime = new Date(`2000-01-01 ${pointage.heure_entree}`);
            const expectedTime = new Date(`2000-01-01 08:00:00`);
            const diffMinutes = Math.max(0, (entryTime - expectedTime) / (1000 * 60));
            pointage.retard_minutes = Math.round(diffMinutes);

            if (pointage.heure_sortie) {
              const exitTime = new Date(`2000-01-01 ${pointage.heure_sortie}`);
              const workedMinutes = (exitTime - entryTime) / (1000 * 60);
              pointage.heures_travaillees = parseFloat((workedMinutes / 60).toFixed(2));
              
              if (pointage.heures_travaillees > 8) {
                pointage.heures_supp = parseFloat((pointage.heures_travaillees - 8).toFixed(2));
                pointage.heures_travaillees = 8;
              }
            }
          }

          await pointage.save();
          syncedCount++;
        } catch (logErr) {
          console.error(`⚠️ Error processing log for ${deviceInfo.name}:`, logErr.message);
        }
      }

      // Update device info in DB
      await BiometricDevice.findByIdAndUpdate(deviceInfo._id, {
        lastSync: new Date(),
        lastOnline: true,
        lastUserCount: users.data ? users.data.length : 0,
        lastLogCount: logs.data ? logs.data.length : 0,
        lastError: null
      });

      await zkInstance.disconnect();
      console.log(`🔌 Disconnected from ${deviceInfo.name}`);
      summary.success++;
      summary.deviceStatus.push({ name: deviceInfo.name, status: 'success', synced: syncedCount });
      
      // Log success
      await ZkLog.create({
        deviceIp: deviceInfo.ip,
        deviceName: deviceInfo.name,
        type: 'sync',
        status: 'success',
        message: `Synchronisation réussie : ${syncedCount} nouveaux pointages.`,
        details: { syncedCount }
      });
    } catch (err) {
      console.error(`❌ Raw error with ${deviceInfo.name}:`, err);
      const errorMsg = err?.message || (typeof err === 'string' ? err : 'Socket/Connection Error (Unknown)');
      
      // Update device error in DB
      await BiometricDevice.findByIdAndUpdate(deviceInfo._id, {
        lastOnline: false,
        lastError: errorMsg
      });

      summary.failed++;
      summary.deviceStatus.push({ 
        name: deviceInfo.name, 
        status: 'error', 
        error: errorMsg
      });

      // Log error
      await ZkLog.create({
        deviceIp: deviceInfo.ip,
        deviceName: deviceInfo.name,
        type: 'sync',
        status: 'error',
        message: `Échec de synchronisation : ${errorMsg}`,
        details: err ? { error: errorMsg } : { error: 'Unknown' }
      });
    }
  }
  return summary;
};

const getDeviceInfo = async (forceLive = false) => {
  const devices = await BiometricDevice.find();
  
  // If not forcing live check, return database info immediately
  if (!forceLive) {
    return devices.map(d => ({
      _id: d._id,
      name: d.name,
      ip: d.ip,
      port: d.port,
      online: d.lastOnline,
      userCount: d.lastUserCount,
      logCount: d.lastLogCount,
      lastSync: d.lastSync,
      error: d.lastError
    }));
  }

  const status = [];
  for (const device of devices) {
    let zkInstance = new ZKLib(device.ip, device.port || 4370, 5000, 4000);
    try {
      await zkInstance.createSocket();
      const users = await zkInstance.getUsers();
      const logs = await zkInstance.getAttendance();
      await zkInstance.disconnect();
      
      const metrics = {
        lastOnline: true,
        lastUserCount: users.data ? users.data.length : 0,
        lastLogCount: logs.data ? logs.data.length : 0,
        lastError: null
      };

      await BiometricDevice.findByIdAndUpdate(device._id, metrics);

      status.push({
        _id: device._id,
        name: device.name,
        ip: device.ip,
        port: device.port,
        online: true,
        userCount: metrics.lastUserCount,
        logCount: metrics.lastLogCount,
        lastSync: device.lastSync
      });
    } catch (err) {
      const errorMsg = err.message || (typeof err === 'string' ? err : 'Connection Error');
      
      await BiometricDevice.findByIdAndUpdate(device._id, {
        lastOnline: false,
        lastError: errorMsg
      });

      status.push({
        _id: device._id,
        name: device.name,
        ip: device.ip,
        port: device.port,
        online: false,
        error: errorMsg,
        lastSync: device.lastSync
      });
    }
  }
  return status;
};

// Start automated polling every minute
const initSync = () => {
    setInterval(() => {
        if (isSyncActive) syncLogs();
    }, 600000);
    
    // Run immediately on start if active
    if (isSyncActive) syncLogs();
};

module.exports = { syncLogs, initSync, getDeviceInfo, toggleSync, getSyncStatus };
