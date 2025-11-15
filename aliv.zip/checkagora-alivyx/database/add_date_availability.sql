USE checkagora_db;

-- Criar tabela de disponibilidade por data específica
CREATE TABLE IF NOT EXISTS doctor_date_availability (
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
