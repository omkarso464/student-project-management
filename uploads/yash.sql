CREATE TABLE Dept_info (
    DEPT_ID int(20) PRIMARY KEY,    Dept_name varchar(40));
DROP TABLE Dept_info;
TRUNCATE TABLE Dept_info;
RENAME TABLE Dept_info TO Department_Details;
INSERT INTO Dept_info 
(DEPT_ID, Dept_name ) 
VALUES
(001, 'Computer Science'),
(002, 'Information Technology'),
(003, 'Electronics And Telecommunication'),
(004, 'Mechanical'),
(005, 'Biotech'),
(006, 'Civil' ),
(007, 'Chemical'),
(008, 'Production'),
SELECT * FROM Dept_info;
UPDATE Dept_info 
SET Dept_name = 'AIDS'
WHERE DEPT_ID = 002;
DELETE FROM Dept_info WHERE DEPT_ID = 006;
Alter Table Dept-info Add Hod_name varchar(50);
Alter Table Dept-info rename Column Dept_name To Department_name;
Select Count (DEPT_id) from Dept_info group by Dept_name
Select Dept_name from Dept_info Order by Dept_name ASC;
