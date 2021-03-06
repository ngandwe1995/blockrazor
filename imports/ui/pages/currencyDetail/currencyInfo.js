import { Template } from 'meteor/templating'
import { HashAlgorithm, FormData, Currencies } from '/imports/api/indexDB.js'

import './currencyInfo.html'

Template.currencyInfo.onRendered(function() {
  $('[data-toggle="tooltip"]').tooltip()

  $.fn.editable.defaults.mode = 'inline' // display them inline
  $.fn.editableform.buttons = `<button type="submit" class="btn btn-primary btn-sm editable-submit"><i class="fa fa-check"></i></button><button type="button" class="btn btn-default btn-sm editable-cancel"><i class="fa fa-close"></i></button>` // custom buttons with fa icons

  // editable fields
  let editables = ['currencyName', 'currencySymbol', 'gitRepo', 'previousNames']

  const validate = function(val) { // the actual proposing part
    if ($(this).attr('id') === 'genesisTimestamp') {
      val = new Date(val).getTime()
    }

    if ($(this).text() !== val) {

      $('#coinChangeModal').modal();


      $('#from').html($(this).text());
      $('#to').html(val);
      $('#forField').html($(this).attr('id'))

      $('#modal_field').val($(this).attr('id'));
      $('#modal_old').val($(this).text());
      $('#modal_new').val(val);

      return ''
    }

    return 'Please change the value if you want to propose a change.'
  }

  editables.forEach(i => $(`#${i}`).editable({
    validate: validate
  }))

  $('#premine').editable({type: 'number', validate: validate});
  $('#maxCoins').editable({type: 'number', validate: validate});

  $('#genesisTimestamp').editable({
    validate: validate,
    type: 'combodate',
    format: 'DD/MM/YYYY',
    template: 'DD / MM / YYYY',    
    combodate: {
      minYear: 2009,
      maxYear: new Date().getUTCFullYear(),
      smartDays: true
    }
  })

  $('#consensusSecurity').editable({
    validate: validate,
    type: 'select',
    source: () => {
      return FormData.find({}).fetch().map(i => ({
        text: i.name,
        value: i.name
      }))
    }
  })

  $('#hashAlgorithm').editable({
    validate: validate,
    type: ($('#consensusSecurity').text() === 'Proof of Work' || $('#consensusSecurity').text() === 'Hybrid') ? 'select' : 'text', // only show select for these two
    source: () => {
      if ($('#consensusSecurity').text() === 'Proof of Work') {
        return HashAlgorithm.find({}).fetch().map(i => ({
          text: i.name,
          value: i._id
        }))
      } else if ($('#consensusSecurity').text() === 'Hybrid') {
        return HashAlgorithm.find({}).fetch().map(i => {
          i.name = `Staking and ${i.name}`

          return {
            text: i.name,
            value: i._id
          }
        })
      }

      return []
    }
  })
});

Template.currencyInfo.events({
  'change #currencyLogoInput': function(event){

  var mime = require('mime-types')
  var instance = this;
  var file = event.target.files[0];
  var uploadError = false;
  var mimetype = mime.lookup(file);
  var fileExtension = mime.extension(file.type);

if(file){
  //check if filesize of image exceeds the global limit
  if (file.size > _coinFileSizeLimit) {
                swal({
                    icon: "error",
                    text: "Image must be under 2mb",
                    button: { className: 'btn btn-primary' }
                });
      uploadError = true;
  }

 if (!_supportedFileTypes.includes(file.type)) {
     swal({
         icon: "error",
         text: "File must be an image",
         button: { className: 'btn btn-primary' }
     });
     uploadError = true;
 }

//Only upload if above validation are true
if(!uploadError){

  $("#fileUploadValue").html("<i class='fa fa-circle-o-notch fa-spin'></i> Uploading");


   var reader = new FileReader();
   reader.onload = function(fileLoadEvent){
     //var binary = event.target.result;
     var binary = reader.result;
     var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();

     Meteor.call('changeCoinImage', file.name, event.target.id, instance._id, reader.result,md5, function(error, result){
       if(error){
        console.log(error)
         swal({
         icon: "error",
         text: error.message,
         button: { className: 'btn btn-primary' }
     });
       }else{
    
    $("#currencyLogoFilename").val(md5+'.'+fileExtension);

       $("#fileUploadValue").html("Change");
       $("#currencyLogoInputLabel").removeClass('btn-primary');
       $("#currencyLogoInputLabel").addClass('btn-success');

       }

     });
   }
   reader.readAsBinaryString(file);
 }
 }
},

'click .changeCoinImage': function(event) {
    $('#coinChangeImage').modal('show');


    $('#coinModal_field').val($(this).attr('id'));
},

'click #proposeCoinChange': function(event){


$('#coinChangeImage').modal('hide');




      Meteor.call('editCoin', [{
        coin_id: $('#_id').val(),
        coinName: $('#name').val(),
        field: 'currencyLogoFilename',
        old: $('#currencyLogoFilename_existing').val(),
        new: $('#currencyLogoFilename').val(),
        changedDate: new Date().getTime(),
        score: 0,
        status: 'pending review',
        notes: $('#currencyNotes').val()
      }], (error, result) => {
          if (error) {
            console.log(error.reason)
            sAlert.error(error.reason)
          } else {
            console.log('coinChangeModal ran successfully')
            sAlert.success('Change proposed.')
          }
      })


},


  'click #proposeChange': function(event){
//close modal
$('#coinChangeModal').modal('hide');

//call method to edit coin

      Meteor.call('editCoin', [{
        coin_id: $('#_id').val(),
        coinName: $('#name').val(),
        field: $('#modal_field').val(),
        old: $('#modal_old').val(),
        new: $('#modal_new').val(),
        changedDate: new Date().getTime(),
        score: 0,
        status: 'pending review',
        notes: $('#currencyNotes').val()
      }], (error, result) => {
          if (error) {
            if(error.reason){
              sAlert.error(error.reason)
            }else{
              sAlert.error(error);
            }
            
          } else {
            console.log('yay')
            sAlert.success('Change proposed.')
          }
      })
  },
  'click .contribute': function(event) {
      event.preventDefault();
      let slug = FlowRouter.getParam("slug");
      FlowRouter.go('/currencyEdit/' + slug + '/' + event.currentTarget.id);
  }
});

Template.currencyInfo.helpers({
  previousNames: () => {
    return (Template.instance().data.previousNames || []).map(i => i.tag) || 'N\\A'
  },
  truncate (val) {
     if (val.length > 20){
    return val.substring(0,20)+'...';
 }
 else{
    return val;
 }
},
   isDateNull(val, field) {

  if (typeof val == "number") {
              return moment(val).format(_globalDateFormat);
      } else {
          if (field) {
              return 'N\\A'
          }
      }

  },
  isNull(val, field) {
      if (val || val === 0) {
          if (typeof val == "string") {
              return val;
          } else if (typeof val == "object") {
              return val.length == 1 ? val[0]: val.join(", ");
          } else if (typeof val == "number") {
              return val;
          }
      } else {
          if (field) {
              return Spacebars.SafeString('<span id=' + field + ' class="label label-danger contribute pointer"><i class="fa fa-plus"></i> Contribute</span>');
          }
      }

  },
      isNullReadOnly(val,field) {

      if (val || val === 0) {
          if (typeof val == "string") {
              return val;
          } else if (typeof val == "object") {

              return val[0].join(", ");
          } else if (typeof val == "number") {
              return val;
          }
      } else {

        return '-'
      }

  },
  hashAlgorithm: function() {
    let prefix = ''
    if (this.consensusSecurity === 'Hybrid') {
      prefix = 'Staking and '
    }

    let algo = HashAlgorithm.findOne({
      _id: this.hashAlgorithm
    })

    return algo ? `${prefix}${algo.name}` : this.hashAlgorithm
  }
});