CREATE TABLE Proj_info (
    project_ID VARCHAR(20) PRIMARY KEY,    title VARCHAR(50),    description VARCHAR(200), objective VARCHAR(250),  upload_date DATE, guide_id VARCHAR(10),domain VARCHAR(50));
ALTER TABLE Proj_info ADD COLUMN status VARCHAR(20);
DROP TABLE Proj_info;
TRUNCATE TABLE Proj_info;
RENAME TABLE Proj_info TO Project_Details;
INSERT INTO Proj_info 
(project_ID, title, description, objective, upload_date, guide_id, domain) 
VALUES
('PJT2025_001', 'Smart Parking System', 'Uses sensors and AI to detect empty slots and guide vehicles.', 'To reduce parking search time and improve traffic flow.', '2025-08-07', 'G102', 'AI and IoT'),
('PJT2025_002', 'Voice Home Automation', 'Controls appliances using voice commands via smart devices.', 'To enhance accessibility and ease of use in smart homes.', '2025-08-06', 'G105', 'IoT'),
('PJT2025_003', 'Fake News Detection', 'Detects false news from text using NLP and ML models.', 'To help reduce the spread of misinformation.', '2025-08-05', 'G108', 'NLP'),
('PJT2025_004', 'Django E-commerce Portal', 'Web portal with product, cart, and order features.', 'To create a user-friendly shopping platform.', '2025-08-04', 'G101', 'Web Development'),
('PJT2025_005', 'Smart Helmet System', 'Detects crashes and sends alerts with GPS.', 'To improve accident response through real-time detection.', '2025-08-03', 'G110', 'Embedded Systems'),
('PJT2025_006', 'Student Result Prediction', 'Predicts marks based on past records using ML.', 'To identify students needing support.', '2025-08-02', 'G107', 'Machine Learning'),
('PJT2025_007', 'Secure Chat App', 'Chat app with encryption and secure login.', 'To provide a privacy-focused messaging platform.', '2025-08-01', 'G109', 'Cybersecurity'),
('PJT2025_008', 'Solar Vehicle Dashboard', 'Dashboard to monitor real-time solar energy in EVs.', 'To analyze energy usage for efficient operation.', '2025-07-31', 'G104', 'IoT and Analytics'),
('PJT2025_009', 'AI Chatbot for College', 'Chatbot for answering student queries.', 'To automate and streamline student support.', '2025-07-30', 'G103', 'AI'),
('PJT2025_010', 'Blockchain Voting App', 'Secure voting system using blockchain.', 'To ensure transparent, tamper-proof voting.', '2025-07-29', 'G106', 'Blockchain');
SELECT * FROM Proj_info;
UPDATE Proj_info 
SET domain = 'AI and IoT'
WHERE project_ID = 'PJT2025_001';
DELETE FROM Proj_info WHERE project_ID = 'PJT2025_010';
