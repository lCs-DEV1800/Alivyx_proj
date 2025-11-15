-- Inserir médicos com senha "alivix123"
USE checkagora_db;

DELETE FROM doctor_availability;
DELETE FROM doctor_ubs;
DELETE FROM doctors;

-- Hash bcrypt para "alivix123": $2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me

INSERT INTO doctors (crm, name, email, phone, password_hash, specialty) VALUES
('CRM-RN-10001', 'Dr. Carlos Alberto Silva', 'carlos.alecrim@alivyx.com', '(84) 98001-0001', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Cardiologia'),
('CRM-RN-10002', 'Dra. Maria Fernanda Santos', 'maria.candelaria@alivyx.com', '(84) 98002-0002', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Clínica Geral'),
('CRM-RN-10003', 'Dr. João Pedro Oliveira', 'joao.capimmacio@alivyx.com', '(84) 98003-0003', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Dermatologia'),
('CRM-RN-10004', 'Dra. Ana Carolina Lima', 'ana.cidadealta@alivyx.com', '(84) 98004-0004', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Ginecologia'),
('CRM-RN-10005', 'Dr. Pedro Henrique Costa', 'pedro.lagoanova@alivyx.com', '(84) 98005-0005', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Pediatria'),
('CRM-RN-10006', 'Dra. Juliana Cristina Rocha', 'juliana.petropolis@alivyx.com', '(84) 98006-0006', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Ortopedia'),
('CRM-RN-10007', 'Dr. Roberto Carlos Alves', 'roberto.pontanegra@alivyx.com', '(84) 98007-0007', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Clínica Geral'),
('CRM-RN-10008', 'Dra. Fernanda Beatriz Souza', 'fernanda.tirol@alivyx.com', '(84) 98008-0008', '$2a$10$ZHdHk0bEj9WMiSMO2X9dpO9ooIVMRyOf7uEMh4Jl7KAewURyIz8me', 'Cardiologia');

INSERT INTO doctor_ubs (doctor_id, ubs_id, is_active) VALUES
(1, 1, TRUE), (2, 2, TRUE), (3, 3, TRUE), (4, 4, TRUE),
(5, 5, TRUE), (6, 6, TRUE), (7, 7, TRUE), (8, 8, TRUE);
