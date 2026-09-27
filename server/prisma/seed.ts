import { PrismaClient, Category } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in development only)
    console.log('🧹 Cleaning existing data...');
    await prisma.commentaire.deleteMany();
    await prisma.decompte.deleteMany();
    await prisma.mission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.structure.deleteMany();
    await prisma.barem.deleteMany();

    // 1. Create Structures (Departments/Services)
    console.log('🏢 Creating structures...');
    const structures = await Promise.all([
        prisma.structure.create({
            data: {
                code: 'DG',
                name: 'Direction Générale',
            },
        }),
        prisma.structure.create({
            data: {
                code: 'DRH',
                name: 'Direction des Ressources Humaines',
            },
        }),
        prisma.structure.create({
            data: {
                code: 'DT',
                name: 'Direction Technique',
            },
        }),
        prisma.structure.create({
            data: {
                code: 'DC',
                name: 'Direction Commerciale',
            },
        }),
        prisma.structure.create({
            data: {
                code: 'DF',
                name: 'Direction Financière',
            },
        }),
        prisma.structure.create({
            data: {
                code: 'DI',
                name: 'Direction Informatique',
            },
        }),
    ]);

    // 2. Create Barem (Rates)
    console.log('💰 Creating barem (rates)...');
    const baremData = [
        {
            libell: 'EXECUTION_MAITRISE' as Category,
            repas_nord: 800.0,
            hebergement_nord: 1200.0,
            repas_sud: 1000.0,
            hebergement_sud: 1500.0,
            montant_km: 15.0,
        },
        {
            libell: 'CADRE' as Category,
            repas_nord: 1200.0,
            hebergement_nord: 1800.0,
            repas_sud: 1500.0,
            hebergement_sud: 2200.0,
            montant_km: 20.0,
        },
        {
            libell: 'CADRE_SUPERIEUR' as Category,
            repas_nord: 1800.0,
            hebergement_nord: 2500.0,
            repas_sud: 2200.0,
            hebergement_sud: 3000.0,
            montant_km: 25.0,
        },
    ];

    const barems = await Promise.all(
        baremData.map((barem) => prisma.barem.create({ data: barem })),
    );

    // 3. Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await Promise.all([
        // Super Admin
        prisma.user.create({
            data: {
                matricule: 1001,
                nom: 'Admin',
                prenom: 'Super',
                email: 'superadmin@algérietelecom.dz',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                grade: 'Directeur Général',
                category: 'CADRE_SUPERIEUR',
                serviceId: 'DG',
                userSince: new Date('2024-01-01'),
            },
        }),
        // Admins
        prisma.user.create({
            data: {
                matricule: 1002,
                nom: 'Benali',
                prenom: 'Ahmed',
                email: 'ahmed.benali@algérietelecom.dz',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                grade: 'Chef de Service',
                category: 'CADRE',
                serviceId: 'DRH',
                userSince: new Date('2024-02-01'),
            },
        }),
        prisma.user.create({
            data: {
                matricule: 1003,
                nom: 'Zemri',
                prenom: 'Fatima',
                email: 'fatima.zemri@algérietelecom.dz',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                grade: 'Responsable Technique',
                category: 'CADRE',
                serviceId: 'DT',
                userSince: new Date('2024-02-15'),
            },
        }),
        // Regular Users
        prisma.user.create({
            data: {
                matricule: 2001,
                nom: 'Mansouri',
                prenom: 'Karim',
                email: 'karim.mansouri@algérietelecom.dz',
                password: hashedPassword,
                role: 'USER',
                status: 'ACTIVE',
                grade: 'Ingénieur',
                category: 'CADRE',
                serviceId: 'DT',
                userSince: new Date('2024-03-01'),
            },
        }),
        prisma.user.create({
            data: {
                matricule: 2002,
                nom: 'Khelifi',
                prenom: 'Amina',
                email: 'amina.khelifi@algérietelecom.dz',
                password: hashedPassword,
                role: 'USER',
                status: 'ACTIVE',
                grade: 'Technicienne',
                category: 'EXECUTION_MAITRISE',
                serviceId: 'DT',
                userSince: new Date('2024-03-15'),
            },
        }),
        prisma.user.create({
            data: {
                matricule: 2003,
                nom: 'Boudjemaa',
                prenom: 'Omar',
                email: 'omar.boudjemaa@algérietelecom.dz',
                password: hashedPassword,
                role: 'USER',
                status: 'ACTIVE',
                grade: 'Commercial',
                category: 'CADRE',
                serviceId: 'DC',
                userSince: new Date('2024-04-01'),
            },
        }),
        prisma.user.create({
            data: {
                matricule: 2004,
                nom: 'Hamidi',
                prenom: 'Leila',
                email: 'leila.hamidi@algérietelecom.dz',
                password: hashedPassword,
                role: 'USER',
                status: 'ACTIVE',
                grade: 'Comptable',
                category: 'EXECUTION_MAITRISE',
                serviceId: 'DF',
                userSince: new Date('2024-04-15'),
            },
        }),
        prisma.user.create({
            data: {
                matricule: 2005,
                nom: 'Benaissa',
                prenom: 'Youcef',
                email: 'youcef.benaissa@algérietelecom.dz',
                password: hashedPassword,
                role: 'USER',
                status: 'ACTIVE',
                grade: 'Développeur Senior',
                category: 'CADRE_SUPERIEUR',
                serviceId: 'DI',
                userSince: new Date('2024-05-01'),
            },
        }),
    ]);

    // 4. Create Missions
    console.log('🎯 Creating missions...');
    const missions = await Promise.all([
        // Completed mission
        prisma.mission.create({
            data: {
                date_sortie: new Date('2024-08-01T08:08:00Z'),
                date_retour: new Date('2024-08-03T18:18:00Z'),
                motif: 'Installation équipements réseau à Oran',
                status: 'COMPLETED',
                transport: 'SERVICE_CAR',
                destination: 'Oran',
                userId: 2001, // Karim Mansouri
                direction: 'NORD',
                hors_wilaya: true,
            },
        }),
        // Ongoing mission
        prisma.mission.create({
            data: {
                date_sortie: new Date('2024-08-15T09:09:00Z'),
                date_retour: new Date('2024-08-17T17:17:00Z'),
                motif: 'Maintenance serveurs Tamanrasset',
                status: 'INPROGRESS',
                transport: 'PERSONAL_CAR',
                destination: 'Tamanrasset',
                userId: 2002, // Amina Khelifi
                direction: 'SUD',
                hors_wilaya: true,
            },
        }),
        // Recent mission
        prisma.mission.create({
            data: {
                date_sortie: new Date('2024-08-20T07:30:00Z'),
                date_retour: new Date('2024-08-20T19:00:00Z'),
                motif: 'Réunion commerciale Constantine',
                status: 'COMPLETED',
                transport: 'TRANSPORT_ENTREPRISE',
                destination: 'Constantine',
                userId: 2003, // Omar Boudjemaa
                direction: 'NORD',
                hors_wilaya: false,
            },
        }),
        // Another ongoing mission
        prisma.mission.create({
            data: {
                date_sortie: new Date('2024-08-25T10:00:00Z'),
                date_retour: new Date('2024-08-27T16:00:00Z'),
                motif: 'Formation équipe développement Ouargla',
                status: 'INPROGRESS',
                transport: 'SERVICE_CAR',
                destination: 'Ouargla',
                userId: 2005, // Youcef Benaissa
                direction: 'SUD',
                hors_wilaya: true,
            },
        }),
    ]);

    // 5. Create Decomptes (Expense Reports)
    console.log('📊 Creating decomptes...');
    const decomptes = await Promise.all([
        // Decompte for first mission (completed, accepted)
        prisma.decompte.create({
            data: {
                repas_pec_nord: 2,
                repas_sans_pec_nord: 1,
                hebergement_pec_nord: 2,
                hebergement_sans_pec_nord: 0,
                montant: 4500.0,
                parcours: 850.0,
                status: 'ACCEPTED',
                missionId: missions[0].n_mission,
            },
        }),
        // Decompte for second mission (pending)
        prisma.decompte.create({
            data: {
                repas_pec_sud: 3,
                repas_sans_pec_sud: 0,
                hebergement_pec_sud: 2,
                hebergement_sans_pec_sud: 1,
                montant: 6200.0,
                parcours: 1200.0,
                status: 'PENDING',
                missionId: missions[1].n_mission,
            },
        }),
        // Decompte for third mission (rejected)
        prisma.decompte.create({
            data: {
                repas_pec_nord: 1,
                repas_sans_pec_nord: 0,
                hebergement_pec_nord: 0,
                hebergement_sans_pec_nord: 0,
                montant: 1200.0,
                parcours: 300.0,
                status: 'REGECTED',
                missionId: missions[2].n_mission,
            },
        }),
        // Decompte for fourth mission (pending)
        prisma.decompte.create({
            data: {
                repas_pec_sud: 2,
                repas_sans_pec_sud: 1,
                hebergement_pec_sud: 2,
                hebergement_sans_pec_sud: 0,
                montant: 5800.0,
                parcours: 950.0,
                status: 'PENDING',
                missionId: missions[3].n_mission,
            },
        }),
    ]);

    // 6. Create Commentaires (Messages/Comments)
    console.log('💬 Creating commentaires...');
    await Promise.all([
        // Comment on accepted decompte
        prisma.commentaire.create({
            data: {
                title: 'Décompte validé',
                type: 'DECOMPTE_STATUS',
                status: 'ACCEPTED',
                userId: 1002, // Ahmed Benali (Admin)
                decompteId: decomptes[0].n_decompte,
            },
        }),
        // Comment on rejected decompte
        prisma.commentaire.create({
            data: {
                title: 'Justificatifs manquants',
                type: 'DECOMPTE_STATUS',
                status: 'REJECTED',
                userId: 1002, // Ahmed Benali (Admin)
                decompteId: decomptes[2].n_decompte,
            },
        }),
        // General comment
        prisma.commentaire.create({
            data: {
                title: 'Demande de précisions',
                type: 'OTHER',
                status: 'PENDING',
                userId: 1003, // Fatima Zemri (Admin)
                decompteId: decomptes[1].n_decompte,
            },
        }),
    ]);

    console.log('✅ Database seeding completed!');
    console.log('\n📋 Summary:');
    console.log(`- ${structures.length} structures created`);
    console.log(`- ${barems.length} barem entries created`);
    console.log(`- ${users.length} users created`);
    console.log(`- ${missions.length} missions created`);
    console.log(`- ${decomptes.length} decomptes created`);
    console.log('- 3 commentaires created');

    console.log('\n🔐 Default login credentials:');
    console.log('Super Admin: superadmin@algérietelecom.dz / password123');
    console.log('Admin: ahmed.benali@algérietelecom.dz / password123');
    console.log('User: karim.mansouri@algérietelecom.dz / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
