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
      
      // Some versions of node-zklib might throw during creation or createSocket
      await zkInstance.createSocket();
      console.log(`✅ Connected to ${deviceInfo.name} (${deviceInfo.ip})`);

      // Get attended logs
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
      if (!err) console.error(`⚠️ ${deviceInfo.name} threw a null or undefined error!`);
      
      summary.failed++;
      summary.deviceStatus.push({ 
        name: deviceInfo.name, 
        status: 'error', 
        error: errorMsg,
        details: err ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : 'null/undefined'
      });

      // Log error
      await ZkLog.create({
        deviceIp: deviceInfo.ip,
        deviceName: deviceInfo.name,
        type: 'sync',
        status: 'error',
        message: `Échec de synchronisation : ${errorMsg}`,
        details: err ? { error: errorMsg, stack: err.stack } : { error: 'Unknown' }
      });
    }
  }
  return summary;
};

const getDeviceInfo = async () => {
  const devices = await BiometricDevice.find();
  const status = [];

  for (const device of devices) {
    let zkInstance = new ZKLib(device.ip, device.port || 4370, 5000, 4000);
    try {
      await zkInstance.createSocket();
      const users = await zkInstance.getUsers();
      const logs = await zkInstance.getAttendance();
      await zkInstance.disconnect();
      
      status.push({
        _id: device._id,
        name: device.name,
        ip: device.ip,
        port: device.port,
        online: true,
        userCount: users.data.length,
        logCount: logs.data.length
      });
    } catch (err) {
      const errorMsg = err.message || (typeof err === 'string' ? err : 'Connection Error');
      status.push({
        _id: device._id,
        name: device.name,
        ip: device.ip,
        port: device.port,
        online: false,
        error: errorMsg
      });
      console.error(`❌ Status check failed for ${device.ip}:`, err);
      
      // Log connection error if offline
      await ZkLog.create({
        deviceIp: device.ip,
        deviceName: device.name,
        type: 'status_check',
        status: 'error',
        message: `Appareil hors ligne : ${errorMsg}`,
        details: { error: errorMsg }
      }).catch(() => {}); // Silent fail for logging
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
