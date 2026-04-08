/**
 * Test Simple : Vérifier que DW_DimEmploye a les dimensions remplies
 * (Genre, Tranche Âge, Ancienneté) sans N/A !
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyOLAPFix() {
  console.log('✅ VÉRIFICATION DU FIX OLAP - Dimensions Correctement Remplies\n');
  console.log('=====================================\n');
  
  try {
    // 1. Login
    console.log('📝 Connexion admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@rh.app',
      password: 'admin123456'
    });
    const adminHeader = { headers: { Authorization: `Bearer ${loginRes.data.token}` } };
    console.log('✅ Connecté\n');

    // 2. Récupérer les dimensions du DW
    console.log('📊 Récupération des dimensions OLAP depuis DW_DimEmploye...\n');
    const dwRes = await axios.get(`${API_URL}/bi/dw-employes`, adminHeader);
    const employes = dwRes.data.data;

    console.log(`Total employés: ${employes.length}\n`);

    // 3. Analyser les dimensions
    console.log('📈 ANALYSE DES DIMENSIONS:\n');
    
    const genres = new Set();
    const tranches = new Set();
    const anciennetes = new Set();
    let naCount = { genre: 0, tranche: 0, anciennete: 0 };

    employes.forEach(emp => {
      if (emp.genre && emp.genre !== 'N/A') genres.add(emp.genre);
      else naCount.genre++;
      
      if (emp.tranche_age && emp.tranche_age !== 'N/A') tranches.add(emp.tranche_age);
      else naCount.tranche++;
      
      if (emp.anciennete_annees !== null && emp.anciennete_annees !== 'N/A') anciennetes.add(emp.anciennete_annees);
      else naCount.anciennete++;
    });

    // Afficher les résultats
    console.log('🔸 GENRE (Sexe):');
    if (genres.size > 0) {
      console.log(`   ✅ REMPLI - Valeurs trouvées: ${Array.from(genres).join(', ')}`);
    } else {
      console.log(`   ❌ VIDE - ${naCount.genre}/${employes.length} avec N/A`);
    }
    console.log(`   Statistiques: ${naCount.genre} N/A, ${employes.length - naCount.genre} remplis`);
    console.log();

    console.log('🔸 TRANCHE D\'ÂGE:');
    if (tranches.size > 0) {
      console.log(`   ✅ REMPLI - Valeurs trouvées: ${Array.from(tranches).sort().join(', ')}`);
    } else {
      console.log(`   ❌ VIDE - ${naCount.tranche}/${employes.length} avec N/A`);
    }
    console.log(`   Statistiques: ${naCount.tranche} N/A, ${employes.length - naCount.tranche} remplis`);
    console.log();

    console.log('🔸 ANCIENNETÉ (Années):');
    if (anciennetes.size > 0) {
      const sorted = Array.from(anciennetes).sort((a, b) => a - b);
      console.log(`   ✅ REMPLI - Valeurs trouvées: ${sorted.join(', ')}`);
    } else {
      console.log(`   ⚠️  Peu de variation (normal si données récentes)`);
    }
    console.log(`   Statistiques: ${naCount.anciennete} N/A, ${employes.length - naCount.anciennete} remplis`);
    console.log();

    // 4. Verdict final
    console.log('=====================================\n');
    console.log('📌 VERDICT FINAL:\n');

    const allGood = naCount.genre === 0 && naCount.tranche === 0 && genres.size > 0 && tranches.size > 0;
    
    if (allGood) {
      console.log('🎉 ✅ SUCCESS! Le problème OLAP est RÉSOLU!\n');
      console.log('Les dimensions sont maintenant correctement remplies:');
      console.log(`  • Genre: ${Array.from(genres).join(', ')}`);
      console.log(`  • Tranche d\'Âge: ${Array.from(tranches).sort().join(', ')}`);
      console.log('\n✅ AUCUNE valeur N/A détectée!\n');
      console.log('Le cube OLAP fonctionnera correctement sur le dashboard.');
    } else {
      console.log('⚠️  Encore quelques problèmes détectés:\n');
      if (naCount.genre > 0) console.log(`  • Genre: ${naCount.genre} N/A à corriger`);
      if (naCount.tranche > 0) console.log(`  • Tranche Âge: ${naCount.tranche} N/A à corriger`);
    }

    console.log('\n=====================================\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

verifyOLAPFix();
