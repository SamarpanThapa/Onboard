const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/onboarding-processes/:id
 * @desc    Get an onboarding process by ID
 * @access  Public (for testing)
 */
router.get('/:id', async (req, res) => {
    try {
        // For testing, return mock data
        const mockProcess = {
            success: true,
            data: {
                _id: req.params.id,
                employee: {
                    name: "John Smith",
                    email: "john.smith@example.com",
                    position: "Software Developer",
                    department: "Engineering"
                },
                status: "submitted",
                isCompleted: false,
                documents: [
                    {
                        id: "doc1",
                        name: "ID Document.pdf",
                        url: "https://example.com/documents/id.pdf",
                        fileType: "application/pdf",
                        description: "Government ID"
                    },
                    {
                        id: "doc2",
                        name: "Profile Picture.jpg",
                        url: "https://example.com/documents/profile.jpg",
                        fileType: "image/jpeg",
                        description: "Employee photo"
                    }
                ],
                personalInfo: {
                    fullName: "John A. Smith",
                    dob: "1985-05-15",
                    address: "123 Main St, Anytown, USA",
                    phone: "555-123-4567",
                    emergencyContact: {
                        name: "Jane Smith",
                        relationship: "Spouse",
                        phone: "555-987-6543"
                    }
                },
                employmentDetails: {
                    position: "Software Developer",
                    department: "Engineering",
                    startDate: "2023-03-15",
                    workSchedule: "Mon-Fri 9am-5pm",
                    bankDetails: {
                        bankName: "First National Bank",
                        accountNumber: "XXXX-XXXX-1234",
                        routingNumber: "XXX-XXX-XXX"
                    }
                },
                submissionDate: new Date(),
                keyDates: {
                    created: new Date(Date.now() - 7*24*60*60*1000),
                    lastUpdated: new Date()
                }
            }
        };

        return res.json(mockProcess);
    } catch (err) {
        console.error('Error fetching onboarding process:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching onboarding process'
        });
    }
});

/**
 * @route   PATCH /api/onboarding-processes/submissions/:id/approve
 * @desc    Approve an onboarding submission
 * @access  Public (for testing)
 */
router.patch('/submissions/:id/approve', async (req, res) => {
    try {
        const { feedback } = req.body;
        
        return res.json({
            success: true,
            message: 'Onboarding submission approved successfully',
            data: {
                _id: req.params.id,
                status: 'approved',
                isCompleted: true,
                feedback: feedback || ''
            }
        });
    } catch (err) {
        console.error('Error approving onboarding submission:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while approving submission'
        });
    }
});

/**
 * @route   PATCH /api/onboarding-processes/submissions/:id/revise
 * @desc    Request revisions for an onboarding submission
 * @access  Public (for testing)
 */
router.patch('/submissions/:id/revise', async (req, res) => {
    try {
        const { feedback, missingItems } = req.body;
        
        return res.json({
            success: true,
            message: 'Revision request sent successfully',
            data: {
                _id: req.params.id,
                status: 'revision_requested',
                feedback: feedback,
                missingItems: missingItems || []
            }
        });
    } catch (err) {
        console.error('Error requesting revision for onboarding submission:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while requesting revision'
        });
    }
});

module.exports = router; 