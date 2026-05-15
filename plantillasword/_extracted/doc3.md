=== FILE: doc3.docx ===
Paragraphs: 130, Tables: 12, Sections: 1

Table of Contents
Purpose
Crate the last release of the architecture to the project “Door control module” based on the requirements described and reviewed in the traceability matrix template and the requirements check list..
Definitions and abbreviations
Definitions
Abbreviations
Only SW Architecture specific abbreviations.
References
Realization constraints and targets
High level project use cases description
Correct operation of a system which controls, supervises, and administrates the door-locking, window position and the associated HW diagnostics of a 4-door vehicle.
A system that has no trouble in resolving operations for 4 doors independently
A system that has clear modularity to reuse parts in each of the 4 door configurations
A system that can respond efficiently to both remote and manual inputs
A system that can operate with a set of dynamic restrictions, for example limiting the window control based on a window lock functionality as well as the physical limitations of the window state.
A system that has always enough information about itself to interact with other car systems
SW Functional Architecture
Identify the functional behavior that will be implemented on Software. (Use cases diagrams + Sequence Diagrams)
Identify different SW functions with its corresponding interaction among them.
Identify and describe the signals and events used to share information among functions. (ERD)
Table of functions (specify feature)
Table of functional Interfaces (app layer interfaces)
Functional Interface (component diagram)
Functional Interaction (classes diagram)
Example
SW Physical Architecture
Define Physical architecture that will be implemented on Software with its corresponding SW decomposition.
Identify different SW Components with its corresponding interaction among them. (Packages Diagram)
Identify and describe the signals and events used to share information among SW Components.
Physical Decomposition
Example diagram
Table of SW components
Table of Physical Interfaces
Physical Interfaces & Interaction (describe files with methods per functionality)
Example
Example
Describe Dynamic Behavior
This chapter shall be used to describe at physical level the runtime behavior of the SW.
Add Sequence diagram + state chart diagram + flow chart
Event periodicity
Interrupt Handling (If Interruptions are used)
Power Modes
Low Power Mode
The system does not operate in low power mode.
High Power Mode
All the system’s functions are declared in a high-power mode state.
Synchronization Mechanisms
To synchronize the system, we used an atom code approach.
Function to Physical Allocation
Perform the allocation of function to a SW component. One function shall be allocated to one SW component (if this cannot be achieved indicate a clarification which part of the function shall be allocated to every SW component). One SW component might have
SW Requirements Allocation
Elements located in SW Project repository path:
SW Integration Plan
Identify the dependencies for SW construction. Identify hierarchy for implementation. Indicate the integration steps for SW construction.

### TABLE 0 (1r x 2c)
Title: | << Project_Name>> Door control Module | SW Architecture
---|---

### TABLE 1 (3r x 5c)
History | History | History | History | History
---|---|---|---|---
Issue status |  | (Index) | Maturity/Date  | (draft/invalid/valid) | (dd-mmm-yyyy) | Author | Department | Check/Release | Department | Description
1.1 | Valid | 10-Nov-21 |  |  | Architecture of the xxx

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
1 | 2 | 3 | SW Requirements | …. | 
 |  | 
 |  | 
 |  | 

### TABLE 4 (11r x 2c)
Function Name | Description
---|---
Get_AntiPinch_Value | Gets the anti-pinch value from the adc
Adc_Init | Initializes the adc configuration
Adc_Run | Implements the adc in a RTOS task
Dio_init | Initializes the dio configuration
Dio_Run | Implements the dio in a RTOS task
Dio_Read_doorlock | Reads the door lock status
 | 
 | 
 | 
 | 

### TABLE 5 (6r x 2c)
Signal/Event | Description
---|---
iMessage | Format that describes a CAN message following a special framework sent through the network
iActionDoor | Information associated with the actuation and the procedure of the door action
iActionWindow | Information associated with the actuation and the procedure of the window action
iConfig | Digital signal indicating the read and the current configuration of the ECU
iMicroReads | Information associated with the read of all pins and peripherals connected

### TABLE 6 (6r x 3c)
SWC Name | Description | Estimated Size (KB)
---|---|---
Button | Handles all button operations (Lock and unlock, window up and window down), keeps track of the button state, and implements the debounce characteristic in both press and release | 1
Door | Handles the physical aspects of the door actuation at a ECU abstraction level, operates the complete looking action procedure and gives the corresponding APIs to the DoorApp | 1
HwConfig | Determines the correct current ECU version based on the configuration switches | 1
WindowApp | Handles the physical aspects of the window actuation at a ECU abstraction level, operates the complete window up/down action procedure and gives the corresponding APIs to the WindowApp | 2
DoorApp | Gives the complete logic to the door locking operations, reading request, buttons and executing actions. Uses the Majority of APIs related to the door | 3

### TABLE 7 (4r x 2c)
Operation | Description
---|---
iDoorApp | Interfaced used to run the door logic on a RTOS task
iWindowApp | Interfaced used to run the window logic on a RTOS task
iHwConfig | Interface used the door app, window app and signals to choose the correct version of each function depending on the hw version

### TABLE 8 (3r x 6c)
Event | Description | Periodicity | Period | Priority | CPU Load
---|---|---|---|---|---
app_task_10 | Task containing the functions that run the window and door actuations. | 10ms | 1 | 4 | 8%
app_task_20 | Task containing the functions that runs the signals APIs and get the information from the CAN network | 20ms | 1 | 3 | 6%

### TABLE 9 (5r x 4c)
ISR task | Description | Priority | CPU Load
---|---|---|---
Button Press | Button interrupt to brake idle state and respond to the manual actuation request | 1 | 2%
Anti-pinch total interrupt | Request to immediately cancel all window actuations and start the anti-pinch procedure | 2 | 1%
Auto lock actuation priority | Request to immediately cancel the lock idle state and start the Auto lock procedure | 2 | 1%
RTOS | Interrupt to change task when needed in freeRTOS | 2 | 2%

### TABLE 10 (8r x 3c)
Function (SYS Level) | SW component | Clarification
---|---|---
Get_AntiPinch_Value | Adc | 
Adc_Init | Adc | 
Adc_Run | FreeRTOS | 
Dio_init | Dio | 
Dio_Run | FreeRTOS | 
Dio_Read_doorlock | Dio | 
Dio_Read_doorlockbutton | Dio | 

### TABLE 11 (5r x 4c)
Integration Step | Description | SW components | Comments
---|---|---|---
1.-OS and microcontroler | Integrate all the functions related to freeRTOS and the configuration of the microcontroler | FreeRTOS | ADC | DIO | MCU | 
2.-ECU abstraction | Work on the basic configuration to design the basic operation of the actuators | Door | Window | Button | HwConfig | 
3.-Signals | Implement the can newtowk and integrate a way for a node to access the information | CanPal | Signals | 
4.-Application | Integrate all function above to design the logic of the Window and door actions with all the detail | WindowApp | DoorApp | 