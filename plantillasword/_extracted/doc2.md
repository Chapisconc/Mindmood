=== FILE: doc2.docx ===
Paragraphs: 92, Tables: 6, Sections: 1

Table of Contents
## Purpose
This document has been created as a demonstration the students to how to create the detailed design from requirements and SW architecture.
## Definitions and abbreviations
Definitions
Abbreviations
Only SW Component specific abbreviations.
References
## Realization constraints and targets
An overview of which are the goals that must be achieved with these functionalities.
## SW Conceptual design
To make a conceptual design identify the product functions and the programs parts needed to produce them.
Identify all relevant parts in a system or sub-system. (Package Diagram)
Describe the global data and the interfaces in order to interact with it. (Class Diagram)
Define which parts are inside & outside the system boundary (Class Diagram)
Define de interfaces between these parts, but also interfaces with neighboring systems and environment. (ERD)
## SW Component internal breakdown
For complex SW Components, the designer may define SW Subcomponents.
Note: SW Subcomponents are synonymous with the previous used term "Module"

Mapping to the file structure:
- Non complex SW Components should be represented by one object file.
- For complex SW Components each SW Subcomponent should be represented by one object file.

<Subcomponent decomposition if applicable>
## Functional Decomposition
Overview of functions and their dependencies shown by a Static Function
Function Description and Dynamic Behavior
Provide detailed static and dynamic description of all functions of the SW Component. 
Functions which are defined in other SW Components shall only be referenced in the external interface description!
The signature description shall be done inside the function header in the source code.

For each function, the following section should be copied
## Function <Type> <function name> (type par 1, ..,  type par n)
Dynamic Behavior
State Chart + Flow Chart
In this document, the dynamic behavior shall be designed on an abstract level showing the principle workflow of a function. Do not show the detailed implementation to ensure that the design description can be maintained with a reasonable effort. The target is not to show the complete detailed implementation 1:1.

The detailed design shall reflect in detail what a function is doing from a black box view. The internal details are useful on an abstract, but not very detailed level. 

If the function is not complex a short textual description might be enough, and a graphical description is not needed.
Symbol and function names shall be self explaining. 
The link to the implementation may be provided by using the same names as in the design or by a comment showing the full name followed by the declaration showing the implementation.
## Function <Type> <function name> (type par 1, ..,  type par n)
Dynamic Behavior
State Chart + Flow Chart
In this document, the dynamic behavior shall be designed on an abstract level showing the principle workflow of a function. Do not show the detailed implementation to ensure that the design description can be maintained with a reasonable effort. The target is not to show the complete detailed implementation 1:1.

The detailed design shall reflect in detail what a function is doing from a black box view. The internal details are useful on an abstract, but not on a very detailed level. 

Symbol and function names shall be self explanatory. 
The link to the implementation may be provided by using the same name as in the design or by a comment showing the full name followed by the declaration showing the implementation.

### TABLE 0 (1r x 2c)
Title: | <Project Name> | SW Component < XXXXXXX >
---|---

### TABLE 1 (3r x 5c)
History | History | History | History | History
---|---|---|---|---
Issue status |  | (Index) | Maturity/Date  | (draft/invalid/valid) | (dd-mmm-yyyy) | Author | Department | Check/Release | Department | Description
1.0 | Valid | 04-0ct-20 |  |  | Creation of the document

### TABLE 2 (5r x 2c)
Special Byte | Special byte received to change the baud rate 55h
---|---
 | 
 | 
 | 
 | 

### TABLE 3 (5r x 3c)
N° | Document name | Reference
---|---|---
1 | SW Architecture description | 
 |  | 
 |  | 
 |  | 

### TABLE 4 (8r x 2c)
Description | Brief description of the function behavior and useful remarks
---|---
Parameter 1 | <input| output| inout> | Give an explanation if the parameter shall be checked by the user, or if a check is implemented in the function here
Parameter 2..n | 
Return Value | 
Precondition | e.g. Function can only be called in a certain state, SW component is initialized | Relation between input parameters where applicable (Input for Module Test)
Post condition | e.g. specific State change e.g. car is locked, EEPROM Values written, | Relation between output parameters where applicable
Error Conditions | 
Requirements | 

### TABLE 5 (8r x 2c)
Description | Brief description of the function behavior and useful remarks
---|---
Parameter 1 | <input| output| inout> | 
Parameter 2..n | 
Return Value | 
Precondition | e.g. Function can only be called in a certain state, SW component is initialized | Relation between input parameters where applicable (Input for Module Test)
Post condition | e.g. specific State change e.g. car is locked, EEPROM Values written, | Relation between output parameters where applicable
Error Conditions | 
Requirements | 