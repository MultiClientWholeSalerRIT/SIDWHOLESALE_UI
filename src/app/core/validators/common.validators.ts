import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import * as _ from 'lodash';

const decimal4to2Regex = /^(\d{1,4}|\d{1,4}\.\d{1,2})$/;
const decimal5to2Regex = /^(\d{1,5}|\d{1,5}\.\d{1,2})$/;
const decimal14to2Regex = /^(\d{1,14}|\d{1,14}\.\d{1,2})$/;
const decimal7to2Regex = /^(\d{1,7}|\d{1,7}\.\d{1,2})$/;
const decimal8to1Regex = /^(\d{1,8}|\d{1,8}\.\d{1})$/;
const decimal7to1Regex = /^(\d{1,7}|\d{1,7}\.\d{1})$/;
const decimal7to1WithNegativesRegex = /^-?(\d{1,7}|\d{1,7}\.\d{1})$/;
const nameFormatRegex = /^([0-9a-zA-Z \-,&\.']*)$/;
const onlyIntegerRegex = /^[0-9]*$/;
const decimal14to4Regex = /^(\d{1,10}|\d{1,10}\.\d{1,4})$/;
const fiscalMMMYYRegex = new RegExp("^((JAN|FEB|MAR|APR|MAY|JUN|JULY|AUG|SEP|OCT|NOV|DEC)-(0[0-9]{1}|1[0-9]{1}|2[0-9]{1}))$", 'i');
const dateMMDDYYYYRegex =new RegExp("^((0[1-9]|[1-9]|1[012])[- /.]([1-9]|0[1-9]|[12][0-9]|3[01])[- /.]((19|20)[0-9]{2}))*$",'i');
const emailRegex =new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$");
const offlineMessageFormatRegex = /^([0-9a-zA-Z \-,'&\.\n]*)$/;
const alphanumericStringWithoutSpecialCharacter = /^[A-Za-z0-9 ]+$/;
const stringWithoutSpecialCharacter = /^[A-Za-z '&\.,\-]+$/;
const onlyNumber = /^[0-9]*$/;
const numberWithHypenAndPlusCharacter = /^[0-9-+]*$/;
const nameFormatRegexWithoutApostrophe = /^([0-9a-zA-Z \-,&\.]*)$/;
export class CommonValidators {

  // Validate Complete Form Group

  static validateFormGroup(formGroup: FormGroup) :void {
    if(!_.isNil(formGroup)) {
      Object.keys(formGroup.controls).forEach((key) => {
        const ctrl = formGroup.get(key);
        ctrl?.markAsTouched({ onlySelf: true })
      })
    }
  }

  //Decimal(4,2) validator
  static isDecimal4to2Validator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && decimal4to2Regex.test(value) !== true) {
      return {
        isDecimal4to2Validator:
          'Please enter proper Number format upto 4(digits) and two decimal places',
      };
    } else {
      return null;
    }
  }
  //Decimal(5,2) validator
  static isDecimal5to2Validator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && decimal5to2Regex.test(value) !== true) {
      return {
        isDecimal5to2Validator:
          'Please enter proper Number format upto 5(digits) and two decimal places',
      };
    } else {
      return null;
    }
  }
  //Decimal(14,2) validator
  static isDecimal14to2Validator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && decimal14to2Regex.test(value) !== true) {
      return {
        isDecimal14to2Validator:
          'Please enter proper Number format upto 14(digits) and two decimal places',
      };
    } else {
      return null;
    }
  }

  //Decimal(7,2) validator
   static isDecimal7to2Validator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && decimal7to2Regex.test(value) !== true) {
      return {
        isDecimal7to2Validator:
          'Please enter proper Number format upto 7(digits) two decimal places',
      };
    } else {
      return null;
    }
  }

  //Decimal(8,1) validator
  static isDecimal8to1Validator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && decimal8to1Regex.test(value) !== true) {
      return {
        isDecimal8to1Validator:
          'Please enter proper Number format upto 8(digits) one decimal places',
      };
    } else {
      return null;
    }
  }


   static isNameFormatValidator(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && nameFormatRegex.test(value) !== true) {
      return {
        isNameFormatValidator: 'Invalid input. Only ampersand, whitespace, hyphen, comma, apostrophe and period allowed.',
      };
    } else {
      return null;
    }
  }
  //Only Integer validator
   static isOnlyIntegerValidator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && onlyIntegerRegex.test(value) !== true) {
      return {
        isOnlyIntegerValidator: 'Please enter only integer value',
      };
    } else {
      return null;
    }
  }

  static fiscalYearMonthValidator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && fiscalMMMYYRegex.test(value) !== true) {
      return {
        fiscalYearMonthValidator: 'Fiscal Year Format should be in MMM-YY',
      };
    } else {
      return null;
    }
  }

  static datePickerValidator(control: FormControl) {
    const value = control.value;
     if (!_.isNil(value)) {
      /* Safe-side-check for null or undefined */
      if (dateMMDDYYYYRegex.test(value) !== true) {
        return {
          datePickerValidator: 'Date Format should be in MM-DD-YYYY',
        };
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

    //Decimal(14,2) validator
    static isDecimal14to4Validator(control: FormControl) {
      const value = control.value;
      if(value == '') {
        return null
      }

      /* Safe-side-check for null or undefined */
      if (!_.isNil(value) && decimal14to4Regex.test(value) !== true) {
        return {
          isDecimal14to4Validator:
            'Please enter proper Number format upto 10(digits) and four decimal places',
        };
      } else {
        return null;
      }
    }
  static emailValidator(control: FormControl) {
    const value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && emailRegex.test(value) !== true) {
      return {
        emailValidator: 'Email Format should be XYZ@domain_name.extension',
      };
    } else {
      return null;
    }
  }

  static isDecimal7to1WithNegativesValidator(control: FormControl) {
    const value = control.value;
    if (!_.isNil(value) && decimal7to1WithNegativesRegex.test(value) !== true) {
      return {
        isDecimal7to1WithNegativesValidator:
          'Please enter proper Number format upto 7(digits) one decimal places',
      };
    } else {
      return null;
    }
  }

  static isCityFormatValidator(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && nameFormatRegex.test(value) !== true) {
      return {
        isCityFormatValidator: 'Please enter proper format',
      };
    } else {
      return null;
    }
  }

  static isOfflineMessageFormatValidator(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && offlineMessageFormatRegex.test(value) !== true) {
      return {
        isOfflineMessageFormatValidator: 'Please enter proper format',
      };
    } else {
      return null;
    }
  }

  static isAlphanumericStringWithoutSpecialCharacterValidator(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && alphanumericStringWithoutSpecialCharacter.test(value) !== true) {
      return {
        isAlphanumericStringWithoutSpecialCharacterValidator: 'Please enter proper format',
      };
    } else {
      return null;
    }
  }
  
  static isOnlyNumber(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && onlyNumber.test(value) !== true) {
      return {
        onlyNumber: 'Please enter proper format',
      };
    } else {
      return null;
    }
  }

  static isNumberWithHypenAndPlusCharacter(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && numberWithHypenAndPlusCharacter.test(value) !== true) {
      return {
        numberWithHypenAndPlusCharacter: 'Please enter proper format',
      };
    } else {
      return null;
    }
  }

  static isStringWithoutSpecialCharacter(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && stringWithoutSpecialCharacter.test(value) !== true) {
      return {
        stringWithoutSpecialCharacter: 'Please enter proper format',
      };
    } else {
      return null;
    }
  }

  static isNameFormatValidatorWithoutApostrophe(control: FormControl) {
    let value = control.value;
    /* Safe-side-check for null or undefined */
    if (!_.isNil(value) && nameFormatRegexWithoutApostrophe.test(value) !== true) {
      return {
        isNameFormatValidatorWithoutApostrophe: 'Please enter proper name format',
      };
    } else {
      return null;
    }
  }

  static required(control: FormControl) {
    let value = control.value;
      if (value === '<div><span>&#160;</span></div>' || value === '<div>' || value === '</div>' || value === '<span>' ||
          value === '</span>' || value === '&#160;' ) {
        return {required: 'Field is required'};
      } else {

        return null;
      }
    
  }
}
