const { validationResult } = require('express-validator');
const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (HR Admin only)
exports.createDepartment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, code, description, head } = req.body;

    // Check if department with same name or code already exists
    const existingDepartment = await Department.findOne({
      $or: [{ name }, { code }]
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    // Create the department
    const department = await Department.create({
      name,
      code,
      description,
      head,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    // Add filtering options
    const query = {};
    
    // Filter by active status if provided
    if (req.query.active !== undefined) {
      query.active = req.query.active === 'true';
    }

    // Filter by parent department if provided
    if (req.query.parent) {
      query.parentDepartment = req.query.parent;
    }

    // Get departments with optional population
    let departments = Department.find(query);
    
    // Populate related fields if requested
    if (req.query.populate === 'true') {
      departments = departments
        .populate('head.userId', 'name email')
        .populate('parentDepartment', 'name code')
        .populate('childDepartments', 'name code')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
    }

    // Sort by name by default, or by provided field
    const sortField = req.query.sort || 'name';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    departments = await departments.sort({ [sortField]: sortOrder });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head.userId', 'name email')
      .populate('parentDepartment', 'name code')
      .populate('childDepartments', 'name code')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private (HR Admin only)
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // If name or code is being updated, check for duplicates
    if (req.body.name || req.body.code) {
      const duplicateCheck = {
        $or: []
      };

      if (req.body.name) {
        duplicateCheck.$or.push({ name: req.body.name });
      }

      if (req.body.code) {
        duplicateCheck.$or.push({ code: req.body.code });
      }

      // Add ID check to exclude current department
      duplicateCheck._id = { $ne: req.params.id };

      const existing = await Department.findOne(duplicateCheck);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name or code already exists'
        });
      }
    }

    // If updating department head, validate
    if (req.body.head && req.body.head.userId) {
      const headUser = await User.findById(req.body.head.userId);
      if (!headUser) {
        return res.status(400).json({
          success: false,
          message: 'User selected as department head does not exist'
        });
      }
    }

    // Add who updated it
    req.body.updatedBy = req.user._id;

    // Update the department
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedDepartment
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private (HR Admin only)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has child departments
    if (department.childDepartments && department.childDepartments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with child departments. Please reassign or delete child departments first.'
      });
    }

    // Check if users are assigned to this department
    const usersInDepartment = await User.countDocuments({ department: department.name });
    if (usersInDepartment > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with assigned users. There are ${usersInDepartment} users in this department.`
      });
    }

    // Safely delete the department
    await department.remove();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Add a team to a department
// @route   POST /api/departments/:id/teams
// @access  Private (HR Admin or Department Admin)
exports.addTeamToDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const { name, description, teamLead } = req.body;

    // Check if team with same name already exists in this department
    const teamExists = department.teams.some(team => team.name === name);
    if (teamExists) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name already exists in the department'
      });
    }

    // Validate team lead if provided
    if (teamLead && teamLead.userId) {
      const leadUser = await User.findById(teamLead.userId);
      if (!leadUser) {
        return res.status(400).json({
          success: false,
          message: 'User selected as team lead does not exist'
        });
      }
    }

    // Create new team object
    const newTeam = {
      name,
      description,
      teamLead
    };

    // Add to teams array
    department.teams.push(newTeam);
    department.updatedBy = req.user._id;

    await department.save();

    res.status(201).json({
      success: true,
      data: department.teams[department.teams.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get department metrics
// @route   GET /api/departments/:id/metrics
// @access  Private (HR Admin or Department Admin)
exports.getDepartmentMetrics = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get current employee count
    const employeeCount = await User.countDocuments({ 
      department: department.name,
      isActive: true
    });

    // Update the department metrics
    department.metrics.employeeCount = employeeCount;
    department.metrics.lastCalculated = new Date();
    department.updatedBy = req.user._id;

    await department.save();

    res.status(200).json({
      success: true,
      data: department.metrics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 