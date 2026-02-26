/**
 * LocaPay - Logique Métier
 * Calculs de kWh au prorata et gestion des formulaires
 * Utilise localStorage pour la persistance des données
 */

const defaultTenants = [
    { id: 1, nom: 'Diallo', prenom: 'Mamadou', chambre: 'A-101', loyer: 150000, kwhAncien: 120, kwhNouveau: 245, telephone: '+221 77 123 45 67', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
    { id: 2, nom: 'Ndiaye', prenom: 'Fatou', chambre: 'A-102', loyer: 175000, kwhAncien: 180, kwhNouveau: 310, telephone: '+221 77 234 56 78', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
    { id: 3, nom: 'Sarr', prenom: 'Ousmane', chambre: 'B-201', loyer: 200000, kwhAncien: 200, kwhNouveau: 420, telephone: '+221 76 345 67 89', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
    { id: 4, nom: 'Touré', prenom: 'Aminata', chambre: 'B-202', loyer: 165000, kwhAncien: 150, kwhNouveau: 280, telephone: '+221 77 456 78 90', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
    { id: 5, nom: 'Ba', prenom: 'Moussa', chambre: 'C-301', loyer: 185000, kwhAncien: 220, kwhNouveau: 380, telephone: '+221 76 567 89 01', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }
];

const STORAGE_KEY = 'locapy_tenants';

function loadTenantsFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try { return JSON.parse(stored); } 
        catch (e) { return [...defaultTenants]; }
    }
    return [...defaultTenants];
}

function saveTenantsToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
}

let tenants = loadTenantsFromStorage();

function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

function calculateIndividualConsumption(tenant) {
    const consumption = tenant.kwhNouveau - tenant.kwhAncien;
    return consumption >= 0 ? consumption : 0;
}

function calculateTotalConsumption() {
    return tenants.reduce((total, tenant) => total + calculateIndividualConsumption(tenant), 0);
}

function calculateElectricityShare(tenant, totalBillAmount) {
    const totalConsumption = calculateTotalConsumption();
    const individualConsumption = calculateIndividualConsumption(tenant);
    if (totalConsumption === 0) return 0;
    return Math.round((individualConsumption / totalConsumption) * totalBillAmount);
}

function calculateTotalToPay(tenant, totalBillAmount) {
    return tenant.loyer + calculateElectricityShare(tenant, totalBillAmount);
}

function calculateConsumptionPercentage(tenant) {
    const totalConsumption = calculateTotalConsumption();
    const individualConsumption = calculateIndividualConsumption(tenant);
    if (totalConsumption === 0) return 0;
    return Math.round((individualConsumption / totalConsumption) * 100);
}

function validateKwhIndex(tenantId, newIndex, oldIndex) {
    if (newIndex < 0 || oldIndex < 0) {
        showAlert('Erreur: Les index ne peuvent pas être négatifs', 'danger');
        return false;
    }
    if (newIndex < oldIndex) {
        showAlert('Erreur: L\'index nouveau ne peut pas être inférieur à l\'ancien', 'danger');
        return false;
    }
    return true;
}

function updateTenantKwh(tenantId, newAncien, nouveau) {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    newAncien = parseInt(newAncien) || 0;
    nouveau = parseInt(nouveau) || 0;
    if (newAncien < 0 || nouveau < 0) {
        showAlert('Erreur: Les index kWh ne peuvent pas être négatifs', 'danger');
        const ancienInput = document.getElementById('ancien-' + tenantId);
        const nouveauInput = document.getElementById('nouveau-' + tenantId);
        if (ancienInput) ancienInput.value = Math.max(0, tenant.kwhAncien);
        if (nouveauInput) nouveauInput.value = Math.max(0, tenant.kwhNouveau);
        return false;
    }
    if (!validateKwhIndex(tenantId, nouveau, newAncien)) {
        const ancienInput = document.getElementById('ancien-' + tenantId);
        const nouveauInput = document.getElementById('nouveau-' + tenantId);
        if (ancienInput) ancienInput.value = tenant.kwhAncien;
        if (nouveauInput) nouveauInput.value = tenant.kwhNouveau;
        return false;
    }
    tenant.kwhAncien = newAncien;
    tenant.kwhNouveau = nouveau;
    saveTenantsToStorage();
    calculateAllTotals();
    return true;
}

function calculateAllTotals() {
    const billAmount = parseFloat(document.getElementById('billAmount')?.value) || 0;
    const totalConsumption = calculateTotalConsumption();
    updateTenantsTable(billAmount, totalConsumption);
    updateStats(billAmount);
    updateCalculationResult(billAmount);
}

function updateTenantsTable(totalBill, totalConsumption) {
    tenants.forEach(tenant => {
        const consumption = calculateIndividualConsumption(tenant);
        const percentage = calculateConsumptionPercentage(tenant);
        const electricityShare = calculateElectricityShare(tenant, totalBill);
        const totalToPay = tenant.loyer + electricityShare;
        
        const consumptionEl = document.getElementById('consumption-' + tenant.id);
        if (consumptionEl) consumptionEl.textContent = consumption + ' kWh';
        
        const progressBar = document.getElementById('progress-' + tenant.id);
        const progressText = document.getElementById('progress-text-' + tenant.id);
        if (progressBar) progressBar.style.width = percentage + '%';
        if (progressText) progressText.textContent = percentage + '%';
        
        const dueEl = document.getElementById('due-' + tenant.id);
        if (dueEl) {
            dueEl.textContent = formatNumber(totalToPay) + ' FCAF';
            dueEl.className = totalToPay > tenant.loyer ? 'text-danger fw-bold' : 'text-success fw-bold';
        }
        
        const elecShareEl = document.getElementById('elec-' + tenant.id);
        if (elecShareEl) elecShareEl.textContent = formatNumber(electricityShare) + ' FCAF';
    });
}

function updateStats(billAmount) {
    const totalRents = tenants.reduce((sum, t) => sum + t.loyer, 0);
    const totalConsumption = calculateTotalConsumption();
    const totalEl = document.getElementById('stat-rents');
    if (totalEl) totalEl.textContent = formatNumber(totalRents);
    const consumptionEl = document.getElementById('stat-consumption');
    if (consumptionEl) consumptionEl.textContent = formatNumber(totalConsumption);
    const chargesEl = document.getElementById('stat-charges');
    if (chargesEl) chargesEl.textContent = formatNumber(billAmount);
}

function updateCalculationResult(billAmount) {
    const resultDiv = document.getElementById('calcResult');
    const resultContent = document.getElementById('calcResultContent');
    const totalConsumption = calculateTotalConsumption();
    
    if (resultDiv && resultContent) {
        let html = '<div class="row g-3"><div class="col-6"><div class="text-muted small">Montant total facture</div><div class="fs-5 fw-bold">' + formatNumber(billAmount) + ' FCAF</div></div><div class="col-6"><div class="text-muted small">Consommation totale</div><div class="fs-5 fw-bold">' + formatNumber(totalConsumption) + ' kWh</div></div></div><hr><div class="text-muted small mb-2">Répartition par locataire:</div>';
        
        tenants.forEach(tenant => {
            const consumption = calculateIndividualConsumption(tenant);
            const percentage = calculateConsumptionPercentage(tenant);
            const share = calculateElectricityShare(tenant, billAmount);
            html += '<div class="d-flex justify-content-between align-items-center py-2 border-bottom"><div><div class="fw-semibold">' + tenant.nom + ' ' + tenant.prenom + '</div><div class="progress mt-1" style="height: 6px; width: 100px;"><div class="progress-bar bg-warning" style="width: ' + percentage + '%"></div></div></div><div class="text-end"><div class="small text-muted">' + consumption + ' kWh (' + percentage + '%)</div><div class="fw-bold text-primary">' + formatNumber(share) + ' FCAF</div></div></div>';
        });
        
        resultContent.innerHTML = html;
        resultDiv.style.display = 'block';
    }
}

function calculateProrata() {
    const billAmount = parseFloat(document.getElementById('billAmount')?.value) || 0;
    calculateAllTotals();
    return billAmount;
}

function calculateKwh() {
    const kwhOld = parseFloat(document.getElementById('kwhOld')?.value) || 0;
    const kwhNew = parseFloat(document.getElementById('kwhNew')?.value) || 0;
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
        showAlert('L\'index nouveau ne peut pas être inférieur à l\'ancien', 'danger');
        return 0;
    }
}

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
    localStorage.setItem('locapy_userType', userType);
    localStorage.setItem('locapy_userEmail', email);
    
    if (userType === 'proprietaire') {
        window.location.href = 'dashboard-proprio.html';
    } else if (userType === 'locataire') {
        window.location.href = 'espace-locataire.html';
    }
    return false;
}

function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'custom-alert alert alert-' + type + ' position-fixed';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.top = '100px';
    alertDiv.style.right = '20px';
    alertDiv.style.minWidth = '350px';
    alertDiv.style.borderRadius = '16px';
    alertDiv.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    
    const icon = type === 'danger' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    const iconColor = type === 'danger' ? '#F56565' : type === 'success' ? '#48BB78' : type === 'warning' ? '#ED8936' : '#4299E1';
    
    alertDiv.innerHTML = '<div class="d-flex align-items-center"><i class="fas fa-' + icon + '" style="color: ' + iconColor + '; font-size: 1.5rem; margin-right: 12px;"></i><div class="flex-grow-1">' + message + '</div><button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button></div>';
    
    document.body.appendChild(alertDiv);
    alertDiv.style.opacity = '0';
    alertDiv.style.transform = 'translateX(100px)';
    setTimeout(() => {
        alertDiv.style.transition = 'all 0.3s ease';
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateX(0)';
    }, 10);
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translateX(100px)';
            setTimeout(() => alertDiv.remove(), 300);
        }
    }, 5000);
}

function searchTenant() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('.table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function resetTenants() {
    if (confirm('Voulez-vous vraiment réinitialiser toutes les données?')) {
        tenants = [...defaultTenants];
        saveTenantsToStorage();
        showAlert('Données réinitialisées!', 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
}

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

function addNewTenant() {
    const nom = document.getElementById('tenantNom')?.value.trim();
    const prenom = document.getElementById('tenantPrenom')?.value.trim();
    const chambre = document.getElementById('tenantChambre')?.value.trim();
    const loyer = parseInt(document.getElementById('tenantLoyer')?.value) || 0;
    const kwhInitial = parseInt(document.getElementById('tenantKwhInitial')?.value) || 0;
    const telephone = document.getElementById('tenantTelephone')?.value.trim() || '';
    const photoPreview = document.getElementById('photoPreview');
    
    if (!nom || !prenom || !chambre || !loyer) {
        showAlert('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Chambre, Loyer)', 'danger');
        return false;
    }
    
    const chambreExists = tenants.some(t => t.chambre.toLowerCase() === chambre.toLowerCase());
    if (chambreExists) {
        showAlert('La chambre ' + chambre + ' est déjà occupée!', 'danger');
        return false;
    }
    
    const newId = Math.max(...tenants.map(t => t.id), 0) + 1;
    let photoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face';
    if (photoPreview.src && photoPreview.src !== window.location.href && !photoPreview.src.includes('data:')) {
        photoUrl = photoPreview.src;
    }
    
    const newTenant = {
        id: newId,
        nom: nom,
        prenom: prenom,
        chambre: chambre,
        loyer: loyer,
        kwhAncien: kwhInitial,
        kwhNouveau: kwhInitial,
        telephone: telephone,
        photo: photoUrl
    };
    
    tenants.push(newTenant);
    saveTenantsToStorage();
    addTenantRowToTable(newTenant);
    calculateAllTotals();
    
    const modalEl = document.getElementById('addTenantModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
    
    document.getElementById('addTenantForm').reset();
    const previewEl = document.getElementById('photoPreview');
    const iconEl = document.getElementById('photoIcon');
    if (previewEl) previewEl.style.display = 'none';
    if (iconEl) iconEl.style.display = 'block';
    
    setTimeout(() => {
        const ancienInput = document.getElementById('ancien-' + newId);
        const nouveauInput = document.getElementById('nouveau-' + newId);
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
    
    showAlert(prenom + ' ' + nom + ' a été ajouté avec succès!', 'success');
    return true;
}

function addTenantRowToTable(tenant) {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;
    
    const billAmount = parseFloat(document.getElementById('billAmount')?.value) || 0;
    const consumption = calculateIndividualConsumption(tenant);
    const percentage = calculateConsumptionPercentage(tenant);
    const elecShare = calculateElectricityShare(tenant, billAmount);
    const totalToPay = tenant.loyer + elecShare;
    
    const tr = document.createElement('tr');
    tr.setAttribute('data-tenant-id', tenant.id);
    tr.innerHTML = '<td><div class="tenant-info"><div class="avatar"><img src="' + tenant.photo + '" alt="' + tenant.nom + ' ' + tenant.prenom + '"></div><div><div class="tenant-name">' + tenant.nom + ' ' + tenant.prenom + '</div><div class="tenant-phone">' + (tenant.telephone || '') + '</div></div></div></td><td><span class="badge badge-room">' + tenant.chambre + '</span></td><td class="fw-bold">' + formatNumber(tenant.loyer) + ' FCAF</td><td><div class="kwh-inputs"><div class="kwh-input-group"><label class="kwh-label">Ancien</label><input type="number" class="kwh-input" id="ancien-' + tenant.id + '" value="' + tenant.kwhAncien + '" min="0"></div><i class="fas fa-arrow-right kwh-arrow"></i><div class="kwh-input-group"><label class="kwh-label">Nouveau</label><input type="number" class="kwh-input" id="nouveau-' + tenant.id + '" value="' + tenant.kwhNouveau + '" min="0"></div></div></td><td><div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height: 8px; min-width: 60px;"><div class="progress-bar bg-warning" id="progress-' + tenant.id + '" style="width: ' + percentage + '%"></div></div><small class="text-muted" id="progress-text-' + tenant.id + '">' + percentage + '%</small></div><small class="text-muted" id="consumption-' + tenant.id + '">' + consumption + ' kWh</small></td><td class="text-primary fw-bold" id="elec-' + tenant.id + '">' + formatNumber(elecShare) + ' FCAF</td><td class="fw-bold" id="due-' + tenant.id + '">' + formatNumber(totalToPay) + ' FCAF</td><td><button class="btn btn-sm btn-outline me-1" onclick="viewTenant(' + tenant.id + ')"><i class="fas fa-eye"></i></button><button class="btn btn-sm btn-outline me-1" onclick="editTenant(' + tenant.id + ')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-outline-danger" onclick="deleteTenant(' + tenant.id + ')"><i class="fas fa-trash"></i></button></td>';
    
    tbody.appendChild(tr);
}

function deleteTenant(tenantId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce locataire?')) return;
    
    const index = tenants.findIndex(t => t.id === tenantId);
    if (index > -1) tenants.splice(index, 1);
    saveTenantsToStorage();
    
    const row = document.querySelector('tr[data-tenant-id="' + tenantId + '"]');
    if (row) row.remove();
    
    calculateAllTotals();
    showAlert('Locataire supprimé avec succès', 'success');
}

// =====================
// VOIR les détails d'un locataire (modale)
// =====================
function viewTenant(tenantId) {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
        showAlert('Locataire non trouvé', 'danger');
        return;
    }
    
    const billAmount = parseFloat(document.getElementById('billAmount')?.value) || 0;
    const consumption = calculateIndividualConsumption(tenant);
    const percentage = calculateConsumptionPercentage(tenant);
    const elecShare = calculateElectricityShare(tenant, billAmount);
    const totalToPay = tenant.loyer + elecShare;
    
    let viewModal = document.getElementById('viewTenantModal');
    if (!viewModal) {
        viewModal = document.createElement('div');
        viewModal.id = 'viewTenantModal';
        viewModal.className = 'modal fade';
        viewModal.setAttribute('tabindex', '-1');
        viewModal.setAttribute('aria-labelledby', 'viewTenantModalLabel');
        viewModal.setAttribute('aria-hidden', 'true');
        document.body.appendChild(viewModal);
    }
    
    viewModal.innerHTML = '<div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content" style="border-radius: 2rem; border: none;"><div class="modal-header" style="border-bottom: 1px solid #e2e8f0; padding: 1.5rem 2rem;"><h5 class="modal-title" id="viewTenantModalLabel" style="font-family: Montserrat, sans-serif; font-weight: 700;"><i class="fas fa-user text-primary me-2"></i>Détails du Locataire</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body" style="padding: 2rem;"><div class="text-center mb-4"><div class="avatar mx-auto mb-3" style="width: 100px; height: 100px; border-radius: 1.5rem; overflow: hidden;"><img src="' + tenant.photo + '" alt="' + tenant.nom + ' ' + tenant.prenom + '" style="width: 100%; height: 100%; object-fit: cover;"></div><h4 style="font-family: Montserrat, sans-serif; font-weight: 700;">' + tenant.prenom + ' ' + tenant.nom + '</h4><p class="text-muted">' + (tenant.telephone || 'Aucun téléphone') + '</p></div><div class="row g-4"><div class="col-md-6"><div class="p-3 bg-light rounded-3"><small class="text-muted d-block">Chambre</small><strong class="fs-5">' + tenant.chambre + '</strong></div></div><div class="col-md-6"><div class="p-3 bg-light rounded-3"><small class="text-muted d-block">Loyer de base</small><strong class="fs-5 text-primary">' + formatNumber(tenant.loyer) + ' FCAF</strong></div></div><div class="col-md-6"><div class="p-3 bg-light rounded-3"><small class="text-muted d-block">Index Ancien</small><strong class="fs-5">' + tenant.kwhAncien + ' kWh</strong></div></div><div class="col-md-6"><div class="p-3 bg-light rounded-3"><small class="text-muted d-block">Index Nouveau</small><strong class="fs-5">' + tenant.kwhNouveau + ' kWh</strong></div></div><div class="col-md-6"><div class="p-3 bg-light rounded-3"><small class="text-muted d-block">Consommation</small><strong class="fs-5">' + consumption + ' kWh (' + percentage + '%)</strong></div></div><div class="col-md-6"><div class="p-3 bg-light rounded-3"><small class="text-muted d-block">Part Électricité</small><strong class="fs-5 text-warning">' + formatNumber(elecShare) + ' FCAF</strong></div></div><div class="col-12"><div class="p-3 bg-warning bg-opacity-10 rounded-3 border border-warning"><small class="text-muted d-block">Total à Payer</small><strong class="fs-3 text-primary">' + formatNumber(totalToPay) + ' FCAF</strong></div></div></div></div><div class="modal-footer" style="border-top: 1px solid #e2e8f0; padding: 1.5rem 2rem;"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal" style="border-radius: 1.5rem;">Fermer</button><button type="button" class="btn btn-primary" onclick="closeViewModal(); editTenant(' + tenant.id + ')" style="border-radius: 1.5rem;"><i class="fas fa-edit me-2"></i>Modifier</button></div></div></div>';
    
    const modal = new bootstrap.Modal(viewModal);
    modal.show();
}

function closeViewModal() {
    const viewModal = document.getElementById('viewTenantModal');
    if (viewModal) {
        const modal = bootstrap.Modal.getInstance(viewModal);
        if (modal) modal.hide();
    }
}

// =====================
// MODIFIER un locataire
// =====================
function editTenant(tenantId) {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
        showAlert('Locataire non trouvé', 'danger');
        return;
    }
    
    const addModalEl = document.getElementById('addTenantModal');
    if (!addModalEl) {
        showAlert('Modale non trouvée', 'danger');
        return;
    }
    
    document.getElementById('tenantNom').value = tenant.nom;
    document.getElementById('tenantPrenom').value = tenant.prenom;
    document.getElementById('tenantChambre').value = tenant.chambre;
    document.getElementById('tenantLoyer').value = tenant.loyer;
    document.getElementById('tenantKwhInitial').value = tenant.kwhAncien;
    document.getElementById('tenantTelephone').value = tenant.telephone || '';
    
    const modalTitle = addModalEl.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit text-primary me-2"></i>Modifier le Locataire';
    }
    
    const saveBtn = addModalEl.querySelector('button[onclick="addNewTenant()"]');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Enregistrer';
        saveBtn.onclick = function() { saveEditedTenant(tenant.id); };
    }
    
    let idInput = document.getElementById('editTenantId');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.id = 'editTenantId';
        document.getElementById('addTenantForm').appendChild(idInput);
    }
    idInput.value = tenant.id;
    
    const modal = new bootstrap.Modal(addModalEl);
    modal.show();
}

// =====================
// ENREGISTRER les modifications
// =====================
function saveEditedTenant(tenantId) {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
        showAlert('Locataire non trouvé', 'danger');
        return;
    }
    
    const nom = document.getElementById('tenantNom')?.value.trim();
    const prenom = document.getElementById('tenantPrenom')?.value.trim();
    const chambre = document.getElementById('tenantChambre')?.value.trim();
    const loyer = parseInt(document.getElementById('tenantLoyer')?.value) || 0;
    const kwhInitial = parseInt(document.getElementById('tenantKwhInitial')?.value) || 0;
    const telephone = document.getElementById('tenantTelephone')?.value.trim() || '';
    
    if (!nom || !prenom || !chambre || !loyer) {
        showAlert('Veuillez remplir tous les champs obligatoires', 'danger');
        return false;
    }
    
    const chambreExists = tenants.some(t => t.id !== tenantId && t.chambre.toLowerCase() === chambre.toLowerCase());
    if (chambreExists) {
        showAlert('La chambre ' + chambre + ' est déjà occupée!', 'danger');
        return false;
    }
    
    tenant.nom = nom;
    tenant.prenom = prenom;
    tenant.chambre = chambre;
    tenant.loyer = loyer;
    tenant.kwhAncien = kwhInitial;
    tenant.telephone = telephone;
    
    saveTenantsToStorage();
    
    const modalEl = document.getElementById('addTenantModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
    
    document.getElementById('addTenantForm').reset();
    const modalTitle = modalEl.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-user-plus text-primary me-2"></i>Nouveau Locataire';
    }
    const saveBtn = modalEl.querySelector('button[onclick="saveEditedTenant(' + tenantId + ')"]');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Enregistrer';
        saveBtn.onclick = addNewTenant;
    }
    const idInput = document.getElementById('editTenantId');
    if (idInput) idInput.remove();
    
    showAlert(prenom + ' ' + nom + ' a été modifié avec succès!', 'success');
    setTimeout(() => window.location.reload(), 1000);
    
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    tenants = loadTenantsFromStorage();
    
    const billInput = document.getElementById('billAmount');
    if (billInput) {
        billInput.addEventListener('input', calculateAllTotals);
        calculateAllTotals();
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchTenant);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    tenants.forEach(tenant => {
        const ancienInput = document.getElementById('ancien-' + tenant.id);
        const nouveauInput = document.getElementById('nouveau-' + tenant.id);
        
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

function getCurrentDate() {
    return new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getCurrentMonth() {
    return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^\+?[0-9\s\-\(\)]{8,}$/.test(phone);
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
window.resetTenants = resetTenants;
window.loadTenantsFromStorage = loadTenantsFromStorage;
window.saveTenantsToStorage = saveTenantsToStorage;
window.viewTenant = viewTenant;
window.editTenant = editTenant;
window.saveEditedTenant = saveEditedTenant;
window.closeViewModal = closeViewModal;
