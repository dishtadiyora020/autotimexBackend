import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import issueTreeController from '../../../controllers/garage/scheduling-tools/issueTreeController.js';
import { issueTreeSchema } from '../../../validation/garage/scheduling-tools/issueTree.js';

const router = express.Router()

router.post(
    "/add-duplicate-issue-tree/:duplicateFromId",
    isUserAuthorized(["Owner", , "Scheduling Tool"]),
    isPayloadValid(issueTreeSchema),
    issueTreeController.addDuplicateIssueTree
);

router.post(
    "/createIssueTree",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    issueTreeController.createIssueTree
)

router.put(
    "/update-duplicate-issue-tree/:issueTreeId",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    isPayloadValid(issueTreeSchema),
    issueTreeController.updateIssueTreeDetails
);

router.get(
    "/get-issue-tree",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    issueTreeController.getIssueTreeDetail
);

router.put(
    "/update-default-issue-tree/:issueTreeId",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    issueTreeController.updateDefaultIssueTree
);
router.put(
    "/issue-tree-service/:issueTreeId",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    issueTreeController.updateIssueTreeService
);

router.get(
    "/get-issue-tree-service/:issueTreeId",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    issueTreeController.getIssueTreeServiceDetail
);

router.get(
    "/get-Default-issue-tree",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    issueTreeController.getDefaultIssueTreeServiceDetail
);


export default router;