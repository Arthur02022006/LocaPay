/**
 * LocaPay - Logique Métier
 * Calculs de kWh au prorata et gestion des formulaires
 * Système adapté au contexte africain (Togo)
 */

// =====================
// DONNÉES DES LOCATAIRES
// =====================
let tenants = [
    { id: 1, nom: 'Diallo', prenom: 'Mamadou', chambre: 'A-101', loyer: 150000, kwhAncien: 120, kwhNouveau: 245 },
    { id: 2, nom: 'Ndiaye', prenom: 'Fatou', chambre: 'A-102', loyer: 175000, kwhAncien: 180, kwhNouveau: 310 },
    { id: 3, nom: 'Sarr', prenom: 'Ousmane', chambre: 'B-201', loyer: 200000, kwhAncien: 200, kwhNouveau: 420 },
    { id: 4, nom: 'Touré', prenom: 'Aminata', chambre: 'B-202', loyer: 165000, kwhAncien: 150, kwhNouveau: 280 },
    { id: 5, nom: 'Ba', prenom: 'Moussa', chambre: 'C-301', loyer: 185000, kwhAncien: 220, kwhNouveau: 380 }
];

// =====================
// Formatage des nombres
// =====================
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

// =====================
// Calcul de consommation individuelle
// =====================
function calculateIndividualConsumption(tenant) {
    const consumption = tenant.kwhNouveau - tenant.kwhAncien;
    return consumption >= 0 ? consumption : 0;
}

// =====================
// Calcul de la consommation totale de la maison
// =====================
function calculateTotalConsumption() {
    return tenants.reduce((total, tenant) => {
        return total + calculateIndividualConsumption(tenant);
    }, 0);
}

// =====================
// Calcul de la part d'électricité d'un locataire (PRORATA)
// =====================
function calculateElectricityShare(tenant, totalBillAmount) {
    const totalConsumption = calculateTotalConsumption();
    const individualConsumption = calculateIndividualConsumption(tenant);
    
    if (totalConsumption === 0) return 0;
    
    // Part Électricité = (Consommation Individuelle / Consommation Totale) * Montant Total
    const share = (individualConsumption / totalConsumption) * totalBillAmount;
    return Math.round(share);
}

// =====================
// Calcul du total à payer (Loyer + Électricité)
// =====================
function calculateTotalToPay(tenant, totalBillAmount) {
    const electricityShare = calculateElectricityShare(tenant, totalBillAmount);
    return tenant.loyer + electricityShare;
}

// =====================
// Calcul du pourcentage de consommation
// =====================
function calculateConsumptionPercentage(tenant) {
    const totalConsumption = calculateTotalConsumption();
    const individualConsumption = calculateIndividualConsumption(tenant);
    
    if (totalConsumption === 0) return 0;
    
    return Math.round((individualConsumption / totalConsumption) * 100);
}

// =====================
// Validation des index kWh - Empêche les valeurs négatives
// =====================
function validateKwhIndex(tenantId, newIndex, oldIndex) {
    // Vérifier que les valeurs ne sont pas négatives
    if (newIndex < 0 || oldIndex < 0) {
        showAlert(`Erreur: Les index ne peuvent pas être négatifs`, 'danger');
        return false;
    }
    
    // Vérifier que le nouvel index n'est pas inférieur à l'ancien
    if (newIndex < oldIndex) {
        showAlert(`Erreur: L'index nouveau (${newIndex}) ne peut pas être inférieur à l'index ancien (${oldIndex})`, 'danger');
        return false;
    }
    
    return true;
}

// =====================
// Mise à jour d'un locataire avec validation stricte
// =====================
function updateTenantKwh(tenantId, newAncien, nouveau) {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    // Convertir en nombres et valider
    newAncien = parseInt(newAncien) || 0;
    nouveau = parseInt(nouveau) || 0;
    
    // Empêcher les valeurs négatives dans les inputs
    if (newAncien < 0 || nouveau < 0) {
        showAlert(`Erreur: Les index kWh ne peuvent pas être négatifs`, 'danger');
        
        // Reset aux valeurs précédentes valides
        const ancienInput = document.getElementById(`ancien-${tenantId}`);
        const nouveauInput = document.getElementById(`nouveau-${tenantId}`);
        if (ancienInput) ancienInput.value = Math.max(0, tenant.kwhAncien);
        if (nouveauInput) nouveauInput.value = Math.max(0, tenant.kwhNouveau);
        return false;
    }
    
    // Validation que le nouvel index >= ancien index
    if (!validateKwhIndex(tenantId, nouveau, newAncien)) {
        // Reset aux valeurs précédentes
        const ancienInput = document.getElementById(`ancien-${tenantId}`);
        const nouveauInput = document.getElementById(`nouveau-${tenantId}`);
        if (ancienInput) ancienInput.value = tenant.kwhAncien;
        if (nouveauInput) nouveauInput.value = tenant.kwhNouveau;
        return false;
    }
    
    // Mettre à jour les valeurs
    tenant.kwhAncien = newAncien;
    tenant.kwhNouveau = nouveau;
    
    // Recalculer tous les totaux
    calculateAllTotals();
    
    return true;
}

// =====================
// Calculer tous les totaux et mettre à jour l'UI
// =====================
function calculateAllTotals() {
    const billAmount = parseFloat(document.getElementById('billAmount')?.value) || 0;
    const totalConsumption = calculateTotalConsumption();
    
    // Mettre à jour le tableau des locataires
    updateTenantsTable(billAmount, totalConsumption);
    
    // Mettre à jour les stats
    updateStats(billAmount);
    
    // Mettre à jour le résultat du calcul
    updateCalculationResult(billAmount);
}

// =====================
// Mettre à jour le tableau des locataires
// =====================
function updateTenantsTable(totalBill, totalConsumption) {
    tenants.forEach(tenant => {
        const consumption = calculateIndividualConsumption(tenant);
        const percentage = calculateConsumptionPercentage(tenant);
        const electricityShare = calculateElectricityShare(tenant, totalBill);
        const totalToPay = tenant.loyer + electricityShare;
        
        // Mettre à jour la consommation
        const consumptionEl = document.getElementById(`consumption-${tenant.id}`);
        if (consumptionEl) {
            consumptionEl.textContent = `${consumption} kWh`;
        }
        
        // Mettre à jour la barre de progression
        const progressBar = document.getElementById(`progress-${tenant.id}`);
        const progressText = document.getElementById(`progress-text-${tenant.id}`);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${percentage}%`;
        }
        
        // Mettre à jour le montant dû
        const dueEl = document.getElementById(`due-${tenant.id}`);
        if (dueEl) {
            dueEl.textContent = `${formatNumber(totalToPay)} FCAF`;
            dueEl.className = totalToPay > tenant.loyer ? 'text-danger fw-bold' : 'text-success fw-bold';
        }
        
        // Mettre à jour la part électricité
        const elecShareEl = document.getElementById(`elec-${tenant.id}`);
        if (elecShareEl) {
            elecShareEl.textContent = `${formatNumber(electricityShare)} FCAF`;
        }
    });
}

// =====================
// Mettre à jour les statistiques
// =====================
function updateStats(billAmount) {
    const totalRents = tenants.reduce((sum, t) => sum + t.loyer, 0);
    const totalConsumption = calculateTotalConsumption();
    
    // Total encaissé (simplifié - sans les impayés pour l'exemple)
    const totalEl = document.getElementById('stat-rents');
    if (totalEl) {
        totalEl.textContent = `${formatNumber(totalRents)}`;
    }
    
    // Consommation totale
    const consumptionEl = document.getElementById('stat-consumption');
    if (consumptionEl) {
        consumptionEl.textContent = `${formatNumber(totalConsumption)}`;
    }
    
    // Montant total des charges
    const chargesEl = document.getElementById('stat-charges');
    if (chargesEl) {
        chargesEl.textContent = `${formatNumber(billAmount)}`;
    }
}

// =====================
// Mettre à jour le résultat du calcul
// =====================
function updateCalculationResult(billAmount) {
    const resultDiv = document.getElementById('calcResult');
    const resultContent = document.getElementById('calcResultContent');
    const totalConsumption = calculateTotalConsumption();
    
    if (resultDiv && resultContent) {
        let html = `
            <div class="row g-3">
                <div class="col-6">
                    <div class="text-muted small">Montant total facture</div>
                    <div class="fs-5 fw-bold">${formatNumber(billAmount)} FCAF</div>
                </div>
                <div class="col-6">
                    <div class="text-muted small">Consommation totale</div>
                    <div class="fs-5 fw-bold">${formatNumber(totalConsumption)} kWh</div>
                </div>
            </div>
            <hr>
            <div class="text-muted small mb-2">Répartition par locataire:</div>
        `;
        
        tenants.forEach(tenant => {
            const consumption = calculateIndividualConsumption(tenant);
            const percentage = calculateConsumptionPercentage(tenant);
            const share = calculateElectricityShare(tenant, billAmount);
            
            html += `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <div class="fw-semibold">${tenant.nom} ${tenant.prenom}</div>
                        <div class="progress mt-1" style="height: 6px; width: 100px;">
                            <div class="progress-bar bg-warning" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="small text-muted">${consumption} kWh (${percentage}%)</div>
                        <div class="fw-bold text-primary">${formatNumber(share)} FCAF</div>
                    </div>
                </div>
            `;
        });
        
        resultContent.innerHTML = html;
        resultDiv.style.display = 'block';
    }
}

// =====================
// Calcul du prorata des charges
// =====================
function calculateProrata() {
    const billAmount = parseFloat(document.getElementById('billAmount')?.value) || 0;
    calculateAllTotals();
    return billAmount;
}

// =====================
// Calcul de consommation kWh
// =====================
function calculateKwh() {
    const kwhOld = parseFloat(document.getElementById('kwhOld')?.value) || 0;
    const kwhNew = parseFloat(document.getElementById('kwhNew')?.value) || 0;
    
    // Empêcher les valeurs négatives
    if (kwhOld < 0 || kwhNew < 0) {
        showAlert('Les index ne peuvent pas être négatifs', 'danger');
        return 0;
    }
    
    const consumption = kwhNew - kwhOld;
    
    if (consumption >= 0) {
        const resultDiv = document.getElementById('kwhResult');
        const consumptionSpan = document.getElementById('kwhConsumption');
        
        if (resultDiv && consumptionSpan) {
            consumptionSpan.textContent = formatNumber(consumption);
            resultDiv.style.display = 'block';
        }
        
        return consumption;
    } else {
        showAlert('L\'index nouveau ne peut pas être inférieur à l\'index ancien', 'danger');
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
    
    if (!email || !password) {
        showAlert('Veuillez remplir tous les champs', 'danger');
        return false;
    }
    
    if (!userType) {
        showAlert('Veuillez sélectionner votre type de compte', 'warning');
        return false;
    }
    
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
    // Supprimer les alertes existantes
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} position-fixed`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.top = '100px';
    alertDiv.style.right = '20px';
    alertDiv.style.minWidth = '350px';
    alertDiv.style.borderRadius = '16px';
    alertDiv.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    
    const icon = type === 'danger' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    const iconColor = type === 'danger' ? '#F56565' : type === 'success' ? '#48BB78' : type === 'warning' ? '#ED8936' : '#4299E1';
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${icon}" style="color: ${iconColor}; font-size: 1.5rem; margin-right: 12px;"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Animation d'entrée
    alertDiv.style.opacity = '0';
    alertDiv.style.transform = 'translateX(100px)';
    setTimeout(() => {
        alertDiv.style.transition = 'all 0.3s ease';
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translateX(100px)';
            setTimeout(() => alertDiv.remove(), 300);
        }
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
// Initialisation au chargement
// =====================
document.addEventListener('DOMContentLoaded', function() {
    // Écouteur pour le montant de la facture
    const billInput = document.getElementById('billAmount');
    if (billInput) {
        billInput.addEventListener('input', calculateAllTotals);
        // Initialiser le calcul
        calculateAllTotals();
    }
    
    // Écouteur pour la recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchTenant);
    }
    
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Ajouter les écouteurs pour les inputs kWh des locataires
    tenants.forEach(tenant => {
        const ancienInput = document.getElementById(`ancien-${tenant.id}`);
        const nouveauInput = document.getElementById(`nouveau-${tenant.id}`);
        
        if (ancienInput && nouveauInput) {
            const updateFn = () => {
                const ancien = parseInt(ancienInput.value) || 0;
                const nouveau = parseInt(nouveauInput.value) || 0;
                updateTenantKwh(tenant.id, ancien, nouveau);
            };
            
            ancienInput.addEventListener('input', updateFn);
            nouveauInput.addEventListener('input', updateFn);
        }
    });
});

// =====================
// Fonctions utilitaires
// =====================
function getCurrentDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
}

function getCurrentMonth() {
    const options = { month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^\+?[0-9\s\-\(\)]{8,}$/;
    return re.test(phone);
}

// =====================
// Aperçu de la photo avant upload
// =====================
function previewPhoto(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('photoPreview');
    const icon = document.getElementById('photoIcon');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            icon.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// =====================
// Ajouter un nouveau locataire
// =====================
function addNewTenant() {
    // Récupérer les valeurs du formulaire
    const nom = document.getElementById('tenantNom')?.value.trim();
    const prenom = document.getElementById('tenantPrenom')?.value.trim();
    const chambre = document.getElementById('tenantChambre')?.value.trim();
    const loyer = parseInt(document.getElementById('tenantLoyer')?.value) || 0;
    const kwhInitial = parseInt(document.getElementById('tenantKwhInitial')?.value) || 0;
    const telephone = document.getElementById('tenantTelephone')?.value.trim() || '';
    const photoInput = document.getElementById('tenantPhoto');
    const photoPreview = document.getElementById('photoPreview');
    
    // Validation des champs obligatoires
    if (!nom || !prenom || !chambre || !loyer) {
        showAlert('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Chambre, Loyer)', 'danger');
        return false;
    }
    
    // Vérifier si la chambre n'est pas déjà occupée
    const chambreExists = tenants.some(t => t.chambre.toLowerCase() === chambre.toLowerCase());
    if (chambreExists) {
        showAlert(`La chambre ${chambre} est déjà occupée!`, 'danger');
        return false;
    }
    
    // Générer un ID unique
    const newId = Math.max(...tenants.map(t => t.id)) + 1;
    
    // Déterminer la photo
    let photoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face';
    if (photoPreview.src && photoPreview.src !== window.location.href) {
        photoUrl = photoPreview.src;
    }
    
    // Créer le nouvel objet locataire
    const newTenant = {
        id: newId,
        nom: nom,
        prenom: prenom,
        chambre: chambre,
        loyer: loyer,
        kwhAncien: kwhInitial,
        kwhNouveau: kwhInitial,
        lastPayment: 0,
        telephone: telephone,
        photo: photoUrl
    };
    
    // Ajouter à la liste
    tenants.push(newTenant);
    
    // Ajouter la ligne au tableau
    addTenantRowToTable(newTenant);
    
    // Mettre à jour les stats
    calculateAllTotals();
    
    // Fermer la modale
    const modalEl = document.getElementById('addTenantModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) {
        modal.hide();
    }
    
    // Réinitialiser le formulaire
    document.getElementById('addTenantForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoIcon').style.display = 'block';
    
    // Ajouter les écouteurs pour les nouveaux inputs kWh
    setTimeout(() => {
        const ancienInput = document.getElementById(`ancien-${newId}`);
        const nouveauInput = document.getElementById(`nouveau-${newId}`);
        
        if (ancienInput && nouveauInput) {
            const updateFn = () => {
                const ancien = parseInt(ancienInput.value) || 0;
                const nouveau = parseInt(nouveauInput.value) || 0;
                updateTenantKwh(newId, ancien, nouveau);
            };
            
            ancienInput.addEventListener('input', updateFn);
            nouveauInput.addEventListener('input', updateFn);
        }
    }, 100);
    
    // Afficher un message de succès
    showAlert(`${prenom} ${nom} a été ajouté avec succès!`, 'success');
    
    return true;
}

// =====================
// Ajouter une ligne de locataire au tableau
// =====================
function addTenantRowToTable(tenant) {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;
    
    const billAmount = parseFloat(document.getElementById('billAmount')?.value) || 0;
    const consumption = calculateIndividualConsumption(tenant);
    const percentage = calculateConsumptionPercentage(tenant);
    const elecShare = calculateElectricityShare(tenant, billAmount);
    const totalToPay = tenant.loyer + elecShare;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <div class="tenant-info">
                <div class="avatar">
                    <img src="${tenant.photo}" alt="${tenant.nom} ${tenant.prenom}">
                </div>
                <div>
                    <div class="tenant-name">${tenant.nom} ${tenant.prenom}</div>
                    <div class="tenant-phone">${tenant.telephone || ''}</div>
                </div>
            </div>
        </td>
        <td><span class="badge badge-room">${tenant.chambre}</span></td>
        <td class="fw-bold">${formatNumber(tenant.loyer)} FCAF</td>
        <td>
            <div class="kwh-inputs">
                <div class="kwh-input-group">
                    <label class="kwh-label">Ancien</label>
                    <input type="number" class="kwh-input" id="ancien-${tenant.id}" value="${tenant.kwhAncien}" min="0">
                </div>
                <i class="fas fa-arrow-right kwh-arrow"></i>
                <div class="kwh-input-group">
                    <label class="kwh-label">Nouveau</label>
                    <input type="number" class="kwh-input" id="nouveau-${tenant.id}" value="${tenant.kwhNouveau}" min="0">
                </div>
            </div>
        </td>
        <td>
            <div class="d-flex align-items-center gap-2">
                <div class="progress flex-grow-1" style="height: 8px; min-width: 60px;">
                    <div class="progress-bar bg-warning" id="progress-${tenant.id}" style="width: ${percentage}%"></div>
                </div>
                <small class="text-muted" id="progress-text-${tenant.id}">${percentage}%</small>
            </div>
            <small class="text-muted" id="consumption-${tenant.id}">${consumption} kWh</small>
        </td>
        <td class="text-primary fw-bold" id="elec-${tenant.id}">${formatNumber(elecShare)} FCAF</td>
        <td class="fw-bold" id="due-${tenant.id}">${formatNumber(totalToPay)} FCAF</td>
        <td>
            <button class="btn btn-sm btn-outline me-1"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-outline me-1"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteTenant(${tenant.id})"><i class="fas fa-trash"></i></button>
        </td>
    `;
    
    tbody.appendChild(tr);
}

// =====================
// Supprimer un locataire
// =====================
function deleteTenant(tenantId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce locataire?')) {
        return;
    }
    
    // Retirer de la liste
    const index = tenants.findIndex(t => t.id === tenantId);
    if (index > -1) {
        tenants.splice(index, 1);
    }
    
    // Retirer du tableau
    const row = document.querySelector(`tr[data-tenant-id="${tenantId}"]`);
    if (row) {
        row.remove();
    }
    
    // Mettre à jour les calculs
    calculateAllTotals();
    
    showAlert('Locataire supprimé avec succès', 'success');
}

// Exporter les fonctions globalement
window.calculateProrata = calculateProrata;
window.calculateKwh = calculateKwh;
window.calculateAllTotals = calculateAllTotals;
window.updateTenantKwh = updateTenantKwh;
window.handleLogin = handleLogin;
window.showAlert = showAlert;
window.searchTenant = searchTenant;
window.formatNumber = formatNumber;
window.getCurrentDate = getCurrentDate;
window.getCurrentMonth = getCurrentMonth;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.previewPhoto = previewPhoto;
window.addNewTenant = addNewTenant;
window.deleteTenant = deleteTenant;
