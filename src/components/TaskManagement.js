import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskManagement.css';

const INITIAL_TASK_STATE = {
  title: '',
  description: '',
  dueDate: '',
  category: 'other',
  processType: 'onboarding',
};

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState(INITIAL_TASK_STATE);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get('/api/tasks');
      setTasks(data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleInputChange = ({ target: { name, value } }) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', {
        ...newTask,
        status: 'pending',
        dueDate: new Date(newTask.dueDate).toISOString()
      });
      setNewTask(INITIAL_TASK_STATE);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const todoTasks = tasks.filter(task => task.status === 'pending');

  return (
    <div className="task-management">
      <h1>Task Management</h1>
      
      <div className="task-form">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={newTask.title}
            onChange={handleInputChange}
            required
          />
          <textarea
            name="description"
            placeholder="Task Description"
            value={newTask.description}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="dueDate"
            value={newTask.dueDate}
            onChange={handleInputChange}
            required
          />
          <select
            name="category"
            value={newTask.category}
            onChange={handleInputChange}
          >
            <option value="documentation">Documentation</option>
            <option value="compliance">Compliance</option>
            <option value="orientation">Orientation</option>
            <option value="equipment">Equipment</option>
            <option value="training">Training</option>
            <option value="other">Other</option>
          </select>
          <select
            name="processType"
            value={newTask.processType}
            onChange={handleInputChange}
          >
            <option value="onboarding">Onboarding</option>
            <option value="offboarding">Offboarding</option>
          </select>
          <button type="submit" className="add-task-btn">Add Task</button>
        </form>
      </div>

      <div className="task-columns">
        <div className="task-column todo">
          <h2>To Do <span className="task-count">{todoTasks.length}</span></h2>
          <div className="task-list">
            {todoTasks.length > 0 ? (
              todoTasks.map(task => (
                <div key={task._id} className="task-card">
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <div className="task-meta">
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    <span className="task-category">{task.category}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-tasks">No tasks to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManagement; 