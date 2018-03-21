import SimpleSchema from 'simpl-schema';

//provides a reason for mdg validated method error throw to notify user from error.message generated by simpleSchema
SimpleSchema.defineValidationErrorTransform(error => {
  const ddpError = new Meteor.Error(error.message);
  ddpError.error = 'validation-error';
  ddpError.details = error.details;
  ddpError.reason = error.details.reduce((a,x)=>a+x.message, "")
  return ddpError;
});

import '../../api/coins/methods.js'
import '../../api/users/methods'
import '../../api/miscellaneous/methods'
import '../../api/features/methods'
import '../../api/redflags/methods'

import './routes.js'

import { newProblem } from '/imports/api/problems/methods'