-- Script completo para resetar o banco de dados CheckAgora
-- Execute este script para limpar e recriar todas as tabelas e dados

-- Excluir banco de dados existente e recriar
DROP DATABASE IF EXISTS checkagora_db;
CREATE DATABASE checkagora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE checkagora_db;

-- ==================== CRIAÇÃO DAS TABELAS ====================

-- Tabela de Usuários (Pacientes)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cpf (cpf),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de UBS (Unidades Básicas de Saúde)
CREATE TABLE ubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Natal',
    state VARCHAR(2) NOT NULL DEFAULT 'RN',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Médicos
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crm VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_crm (crm),
    INDEX idx_specialty (specialty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Vínculo Médico-UBS
CREATE TABLE doctor_ubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    ubs_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (ubs_id) REFERENCES ubs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_ubs (doctor_id, ubs_id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_ubs (ubs_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Disponibilidade do Médico (por dia da semana)
CREATE TABLE doctor_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    ubs_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Domingo, 1=Segunda, ..., 6=Sábado',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (ubs_id) REFERENCES ubs(id) ON DELETE CASCADE,
    INDEX idx_doctor_ubs (doctor_id, ubs_id),
    INDEX idx_day (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Disponibilidade por Data Específica
CREATE TABLE doctor_date_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    ubs_id INT NOT NULL,
    available_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (ubs_id) REFERENCES ubs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_date (doctor_id, ubs_id, available_date),
    INDEX idx_doctor_ubs (doctor_id, ubs_id),
    INDEX idx_date (available_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Agendamentos
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    ubs_id INT NOT NULL,
    appointment_type ENUM('exam', 'consultation') NOT NULL DEFAULT 'exam',
    specialty VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    queue_position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (ubs_id) REFERENCES ubs(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_date (appointment_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Notificações
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    doctor_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Contador de Fila Global
CREATE TABLE queue_counter (
    id INT PRIMARY KEY DEFAULT 1,
    current_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== INSERÇÃO DE DADOS INICIAIS ====================

-- Inserir contador inicial
INSERT INTO queue_counter (id, current_count) VALUES (1, 0);

-- Inserir UBS
INSERT INTO ubs (name, district, city, state, latitude, longitude) VALUES
('UBS Alecrim', 'Alecrim', 'Natal', 'RN', -5.7945, -35.2188),
('UBS Candelária', 'Candelária', 'Natal', 'RN', -5.7845, -35.2088),
('UBS Capim Macio', 'Capim Macio', 'Natal', 'RN', -5.8545, -35.1788),
('UBS Cidade Alta', 'Cidade Alta', 'Natal', 'RN', -5.7745, -35.1988),
('UBS Lagoa Nova', 'Lagoa Nova', 'Natal', 'RN', -5.8345, -35.2088),
('UBS Petrópolis', 'Petrópolis', 'Natal', 'RN', -5.7845, -35.1888),
('UBS Ponta Negra', 'Ponta Negra', 'Natal', 'RN', -5.8845, -35.1688),
('UBS Tirol', 'Tirol', 'Natal', 'RN', -5.7945, -35.1988);

-- Inserir médicos de exemplo
-- Senha padrão para todos: "senha123"
-- Hash bcrypt gerado com bcryptjs
INSERT INTO doctors (crm, name, email, phone, password_hash, specialty) VALUES
('12345', 'Dr. Carlos Silva', 'carlos.silva@checkagora.com', '(84) 98888-1111', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Cardiologia'),
('12346', 'Dra. Maria Santos', 'maria.santos@checkagora.com', '(84) 98888-2222', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Clínica Geral'),
('12347', 'Dr. João Oliveira', 'joao.oliveira@checkagora.com', '(84) 98888-3333', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Dermatologia'),
('12348', 'Dra. Ana Paula', 'ana.paula@checkagora.com', '(84) 98888-4444', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Ginecologia'),
('12349', 'Dr. Pedro Costa', 'pedro.costa@checkagora.com', '(84) 98888-5555', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Pediatria'),
('12350', 'Dra. Juliana Lima', 'juliana.lima@checkagora.com', '(84) 98888-6666', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Ortopedia'),
('12351', 'Dr. Roberto Alves', 'roberto.alves@checkagora.com', '(84) 98888-7777', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Clínica Geral'),
('12352', 'Dra. Fernanda Rocha', 'fernanda.rocha@checkagora.com', '(84) 98888-8888', '$2a$10$eDbo3I0Ek4105NThB/bJmORjAIFK1ZwaXgmF2M5W1ZDPzRxtOpD5G', 'Cardiologia');

-- Vincular médicos às UBS
INSERT INTO doctor_ubs (doctor_id, ubs_id) VALUES
(1, 1), -- Dr. Carlos Silva na UBS Alecrim
(2, 2), -- Dra. Maria Santos na UBS Candelária
(3, 3), -- Dr. João Oliveira na UBS Capim Macio
(4, 4), -- Dra. Ana Paula na UBS Cidade Alta
(5, 5), -- Dr. Pedro Costa na UBS Lagoa Nova
(6, 6), -- Dra. Juliana Lima na UBS Petrópolis
(7, 7), -- Dr. Roberto Alves na UBS Ponta Negra
(8, 8); -- Dra. Fernanda Rocha na UBS Tirol

-- Criar disponibilidade padrão para os médicos (Segunda a Sexta, 8h às 17h)
INSERT INTO doctor_availability (doctor_id, ubs_id, day_of_week, start_time, end_time) 
SELECT d.id, du.ubs_id, dow.day, '08:00:00', '17:00:00'
FROM doctors d
JOIN doctor_ubs du ON d.id = du.doctor_id
CROSS JOIN (
    SELECT 1 as day UNION ALL
    SELECT 2 UNION ALL
    SELECT 3 UNION ALL
    SELECT 4 UNION ALL
    SELECT 5
) dow;

-- ==================== MENSAGEM DE CONCLUSÃO ====================
SELECT 'Banco de dados resetado com sucesso!' as Status;
SELECT 'Total de UBS criadas:' as Info, COUNT(*) as Total FROM ubs;
SELECT 'Total de médicos criados:' as Info, COUNT(*) as Total FROM doctors;
SELECT 'Senha padrão para todos os médicos: senha123' as Importante;
SELECT 'Código de registro para novos médicos: ALIVIX' as Importante;
