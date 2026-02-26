/**
 * LocaPay - Logique Métier
 * Calculs de kWh au prorata et gestion des formulaires
 */

// =====================
// Formatage des nombres
// =====================
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

// =====================
// Calcul du prorata des charges
// =====================
function calculateProrata() {
    // Récupérer les valeurs
    const billAmount = parseFloat(document.getElementById('billAmount').value) || 0;
    const roomCount = parseInt(document.getElementById('roomCount').value) || 1;
    
    // Calculer le prorata
    if (roomCount > 0) {
        const prorata = Math.round(billAmount / roomCount);
        
        // Afficher le résultat
        const resultDiv = document.getElementById('calcResult');
        const amountSpan = document.getElementById('prorataAmount');
        
        if (resultDiv && amountSpan) {
            amountSpan.textContent = formatNumber(prorata);
            resultDiv.style.display = 'block';
            
            // Animation
            resultDiv.style.opacity = '0';
            resultDiv.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                resultDiv.style.transition = 'all 0.3s ease';
                resultDiv.style.opacity = '1';
                resultDiv.style.transform = 'translateY(0)';
            }, 10);
        }
        
        return prorata;
    }
    
    return 0;
}

// =====================
// Calcul de consommation kWh
// =====================
function calculateKwh() {
    const kwhOld = parseFloat(document.getElementById('kwhOld').value) || 0;
    const kwhNew = parseFloat(document.getElementById('kwhNew').value) || 0;
    
    const consumption = kwhNew - kwhOld;
    
    if (consumption >= 0) {
        const resultDiv = document.getElementById('kwhResult');
        const consumptionSpan = document.getElementById('kwhConsumption');
        
        if (resultDiv && consumptionSpan) {
            consumptionSpan.textContent = formatNumber(consumption);
            resultDiv.style.display = 'block';
            
            // Animation
            resultDiv.style.opacity = '0';
            resultDiv.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                resultDiv.style.transition = 'all 0.3s ease';
                resultDiv.style.opacity = '1';
                resultDiv.style.transform = 'translateY(0)';
            }, 10);
        }
        
        return consumption;
    } else {
        alert('L\'index nouveau ne peut pas être inférieur à l\'index ancien');
        return 0;
    }
}

// =====================
// Gestion du formulaire de connexion
// =====================
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    // Validation
    if (!email || !password) {
        showAlert('Veuillez remplir tous les champs', 'danger');
        return false;
    }
    
    if (!userType) {
        showAlert('Veuillez sélectionner votre type de compte', 'warning');
        return false;
    }
    
    // Simulation de connexion
    if (userType === 'proprietaire') {
        window.location.href = 'dashboard-proprio.html';
    } else if (userType === 'locataire') {
        window.location.href = 'espace-locataire.html';
    }
    
    return false;
}

// =====================
// Afficher les alertes
// =====================
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'danger' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// =====================
// Recherche de locataire
// =====================
function searchTenant() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('.table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// =====================
// Calcul automatique lors de la saisie
// =====================
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter les écouteurs d'événements pour le calcul automatique
    const billInput = document.getElementById('billAmount');
    const roomInput = document.getElementById('roomCount');
    
    if (billInput && roomInput) {
        billInput.addEventListener('input', calculateProrata);
        roomInput.addEventListener('input', calculateProrata);
    }
    
    // Recherche de locataire
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchTenant);
    }
    
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Initialiser le calcul du prorata au chargement
    if (document.getElementById('billAmount')) {
        calculateProrata();
    }
});

// =====================
// Fonctions utilitaires
// =====================

// Ob date du jour formattenir laée
function getCurrentDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
}

// Obtenir le mois actuel
function getCurrentMonth() {
    const options = { month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
}

// Valider un email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Valider un numéro de téléphone
function validatePhone(phone) {
    const re = /^\+?[0-9\s\-\(\)]{8,}$/;
    return re.test(phone);
}

//Exporter les fonctions globalement
window.calculateProrata = calculateProrata;
window.calculateKwh = calculateKwh;
window.handleLogin = handleLogin;
window.showAlert = showAlert;
window.searchTenant = searchTenant;
window.formatNumber = formatNumber;
window.getCurrentDate = getCurrentDate;
window.getCurrentMonth = getCurrentMonth;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
