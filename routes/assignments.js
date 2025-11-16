const express = require('express');
const router = express.Router();
const assignmentsData = require('../data');

let Assignment = require('../model/assignment');

function peuplerBD(req, res) {
    console.log(`🔄 Peuplement avec ${assignmentsData.length} assignments...`);
    
    Assignment.deleteMany({})
        .then(() => {
          
            const assignmentsToInsert = assignmentsData.map(a => ({
                id: a.id,
                nom: a.nom,
                dateDeRendu: new Date(a.dateDeRendu || a.DateRendu),
                rendu: a.rendu !== undefined ? a.rendu : a.Rendu
            }));
            
            return Assignment.insertMany(assignmentsToInsert);
        })
        .then((result) => {
            console.log(`✅ ${result.length} assignments insérés!`);
            res.json({ 
                success: true,
                message: `${result.length} assignments ajoutés à la base`,
                count: result.length 
            });
        })
        .catch(err => {
            console.error("❌ Erreur:", err);
            res.status(500).json({ error: err.message });
        });
}
// Récupérer tous les assignments (GET)
function getAssignments(req, res){
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`📄 Page demandée: ${page}, Limit: ${limit}`);
    
    var aggregateQuery = Assignment.aggregate();
    

    Assignment.aggregatePaginate(
        aggregateQuery,
        {
            page: page,
            limit: limit
        },
        (err, result) => { 
            if(err){
                console.error("❌ Erreur pagination:", err);
                res.status(500).send(err);
                return;
            }
            
            if (!result) {
                console.error("❌ Aucun résultat de pagination");
                res.status(500).send("Erreur de pagination");
                return;
            }
            
            console.log("✅ Pagination réussie, docs reçus:", result.docs ? result.docs.length : 0);
            
     
            res.json(result);
        }
    );
}

// Récupérer un assignment par son id (GET)
function getAssignment(req, res){
    let assignmentId = req.params.id;
    
    console.log("🔍 Recherche assignment avec ID:", assignmentId);
    
    // Vérifier si c'est un ObjectId MongoDB (24 caractères hexa)
    if (assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log("🔍 Recherche par _id MongoDB");
        Assignment.findById(assignmentId, (err, assignment) => {
            if(err){
                console.error("❌ Erreur recherche par _id:", err);
                res.status(500).json({error: err.message});
                return;
            }
            if(!assignment) {
                console.log("❌ Assignment non trouvé par _id");
                res.status(404).json({error: 'Assignment non trouvé'});
                return;
            }
            console.log("✅ Assignment trouvé par _id:", assignment.nom);
            res.json(assignment);
        });
    } else {
        // Essayer de chercher par id numérique
        try {
            let idNumerique = parseInt(req.params.id);
            if (isNaN(idNumerique)) {
                throw new Error('ID non numérique');
            }
            
            console.log("🔍 Recherche par id numérique:", idNumerique);
            Assignment.findOne({id: idNumerique}, (err, assignment) => {
                if(err){
                    console.error("❌ Erreur recherche par id:", err);
                    res.status(500).json({error: err.message});
                    return;
                }
                if(!assignment) {
                    console.log("❌ Assignment non trouvé par id");
                    res.status(404).json({error: 'Assignment non trouvé'});
                    return;
                }
                console.log("✅ Assignment trouvé par id:", assignment.nom);
                res.json(assignment);
            });
        } catch (error) {
            console.error("❌ ID invalide:", assignmentId);
            res.status(400).json({error: 'ID invalide'});
        }
    }
}

// Ajout d'un assignment (POST)
function postAssignment(req, res){
    let assignment = new Assignment();
    assignment.id = req.body.id; // On garde id numérique pour la compatibilité
    assignment.nom = req.body.nom;
    assignment.dateDeRendu = req.body.dateDeRendu;
    assignment.rendu = req.body.rendu;

    console.log("📨 POST assignment reçu :");
    console.log(assignment)

    assignment.save( (err) => {
        if(err){
            res.send('impossible à post assignment ', err);
        }
        res.json({ message: `${assignment.nom} sauvé!`})
    })
}

// Update d'un assignment (PUT) - CORRIGÉ
function updateAssignment(req, res) {
    console.log("🔄 UPDATE recu assignment : ");
    console.log("Body reçu:", req.body);
    
    let updateQuery = {};
    let assignmentId = req.params.id;
    
    // Déterminer si on cherche par _id ou id numérique
    if (assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
        updateQuery = { _id: assignmentId };
        console.log("🔄 Update par _id MongoDB");
    } else {
        updateQuery = { id: parseInt(assignmentId) };
        console.log("🔄 Update par id numérique");
    }
   
    Assignment.findOneAndUpdate(
        updateQuery, 
        req.body, 
        {new: true}, 
        (err, assignment) => {
            if (err) {
                console.error("Erreur update:", err);
                res.send(err)
            } else if (!assignment) {
                console.log("Assignment non trouvé pour update");
                res.status(404).send('Assignment not found');
            } else {
                console.log(" Assignment mis à jour:", assignment.nom);
                res.json({message: 'updated', assignment: assignment});
            }
        }
    );
}

// suppression d'un assignment (DELETE) - CORRIGÉ
function deleteAssignment(req, res) {
    let assignmentId = req.params.id;
    let deleteQuery = {};
    
    console.log("🗑️ DELETE assignment ID:", assignmentId);
    
    // Déterminer si on cherche par _id ou id numérique
    if (assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
        deleteQuery = { _id: assignmentId };
        console.log("🗑️ Delete par _id MongoDB");
    } else {
        deleteQuery = { id: parseInt(assignmentId) };
        console.log("🗑️ Delete par id numérique");
    }
    
    Assignment.findOneAndRemove(deleteQuery, (err, assignment) => {
        if (err) {
            console.error("Erreur delete:", err);
            res.send(err);
        } else if (!assignment) {
            console.log("Assignment non trouvé pour delete");
            res.status(404).send('Assignment nest pas trouvé');
        } else {
            console.log("Assignment supprimé:", assignment.nom);
            res.json({message: `${assignment.nom} supprimé`});
        }
    });
}

router.get('/assignments', getAssignments);
router.get('/assignments/:id', getAssignment);
router.post('/assignments', postAssignment);
router.put('/assignments/:id', updateAssignment); 
router.delete('/assignments/:id', deleteAssignment);
router.get('/assignments/peupler', peuplerBD);

module.exports = router;