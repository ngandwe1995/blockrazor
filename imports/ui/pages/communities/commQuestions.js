import { Template } from 'meteor/templating';
import { Currencies, Ratings, Bounties } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie'

import './commQuestions.html'

Template.commQuestions.onCreated(function bodyOnCreated() {
    this.autorun(() => {
        SubsCache.subscribe('approvedcurrencies')
    })

    this.cnt = 0
    this.ties = 0
})

Template.commQuestions.helpers({
    outstandingRatings: () => {
        return Ratings.find({
            $or: [{
                answered: false,
                catagory: 'community'
            }, {
                answered: false,
                context: 'community'
            }]
        }).count()
    },
    questions: () => {
        return Ratings.findOne({
            $or: [{
                answered: false,
                catagory: 'community'
            }, {
                answered: false,
                context: 'community'
            }]
        })
    },
	getLogo(img){
      if (img){
        return _coinUpoadDirectoryPublic + img;
      }else{
        return '/images/noimage.png'
      }
  },
    currency0: function() {
        return Currencies.findOne({_id: this.currency0Id })
    },
    currency1: function() {
        return Currencies.findOne({ _id: this.currency1Id })
    }
})


Template.commQuestions.events({
    'mouseover .choice': (event, templateInstance) => {
        $('.choice').css('cursor', 'pointer')
    },
    'click .choice': function(event, templateInstance) {
        if (event.currentTarget.id === 'tie') {
            templateInstance.ties++
        } else {
            templateInstance.ties = 0
        }

        Meteor.call('answerCommunityRating', this._id, event.currentTarget.id, (err, data) => {
            if (err && err.reason === 'xor') {
                if (templateInstance.cnt++ === 0) {
                    sAlert.error('Your answer is in contradiction with your previous answers. Please try again. If this persists, your progress will be purged and bounties will be nullified.')
                } else {
                    sAlert.error('Lazy answering detected. You\'ll have to start all over again.')
                    Meteor.call('deleteCommunityRatings', (err, data) => {})

                    templateInstance.cnt = 0
                }
            }

            Cookies.set('workingBounty', false, { expires: 1 })

            if (templateInstance.ties > 10) { // ties can't be checked with XOR questions, as XOR only works on booleans. Nonetheless, if the user clicks on 'tie' 10 times in a row, it's safe to say that he/she is just lazy answering
                sAlert.error('Lazy answering detected. You\'ll have to start all over again.')
                Meteor.call('deleteCommunityRatings', (err, data) => {})

                templateInstance.ties = 0
            }
        })
    }
})
