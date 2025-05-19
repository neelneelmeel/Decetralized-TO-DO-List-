// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19; // Use a recent compiler version

contract TodoList {

    // Structure to represent a single task
    struct Task {
        uint id;          // Unique identifier
        string content;   // Description of the task
        bool completed;   // Status of the task
        address owner;    // Address of the task creator (optional, but good practice)
    }

    // State variable to keep track of the next task ID
    uint public taskCount = 0;

    // Mapping to store tasks: task ID => Task struct
    mapping(uint => Task) public tasks;

    // Event emitted when a new task is created
    event TaskCreated(
        uint id,
        string content,
        bool completed,
        address owner
    );

    // Event emitted when a task's completion status is toggled
    event TaskCompletedToggled(
        uint id,
        bool completed
    );

    // Function to add a new task to the list
    function createTask(string memory _content) public {
        // Input validation: Ensure content is not empty
        require(bytes(_content).length > 0, "Task content cannot be empty");

        taskCount++; // Increment task counter first to get the new ID
        tasks[taskCount] = Task(taskCount, _content, false, msg.sender); // Store the new task

        // Emit an event to notify listeners (like our frontend)
        emit TaskCreated(taskCount, _content, false, msg.sender);
    }

    // Function to toggle the completion status of a task
    function toggleCompleted(uint _id) public {
        // Input validation: Ensure the task exists
        require(_id > 0 && _id <= taskCount, "Task ID is invalid");

        // Optional: Ensure only the owner or a specific role can toggle
        // require(tasks[_id].owner == msg.sender, "Only the owner can modify this task");
        // For simplicity in this example, anyone can toggle any task.

        Task storage _task = tasks[_id]; // Get a storage reference to the task
        _task.completed = !_task.completed; // Toggle the completed status

        // Emit an event
        emit TaskCompletedToggled(_id, _task.completed);
    }

    // Optional: A function to get task details (useful if mapping getter isn't sufficient)
    function getTask(uint _id) public view returns (uint, string memory, bool, address) {
        require(_id > 0 && _id <= taskCount, "Task ID is invalid");
        Task memory _task = tasks[_id];
        return (_task.id, _task.content, _task.completed, _task.owner);
    }
}