import Picker from './picker.js';
import locales from './locales.js';

export default class Input {
  constructor(input) {
    this.element = input;
    this.element.setAttribute(`data-has-picker`, ``);

    let langEl = this.element,
        lang = ``;

    while(langEl.parentNode) {
      lang = langEl.getAttribute(`lang`);

      if(lang) {
        break;
      }

      langEl = langEl.parentNode;
    }

    this.locale = lang || `en`;

    this.localeText = this.getLocaleText();

    Object.defineProperties(
      this.element,
      {
        'valueAsDate': {
          get: ()=> {
            if(!this.element.value) {
              return null;
            }

            const val = this.element.value.split(/\D/);

            const fmt = this.localeText.format.split(/\W/);

            return new Date(`${val[fmt.indexOf(`Y`)]}-${val[fmt.indexOf(`M`)]}-${val[fmt.indexOf(`D`)]}`);
          },
          set: val=> {
            const YMD = val.toISOString().slice(0,10).split(`-`);

            this.element.value = this.localeText.format
              .replace(`Y`, YMD[0])
              .replace(`M`, YMD[1])
              .replace(`D`, YMD[2]);
          }
        },
        'valueAsNumber': {
          get: ()=> {
            if(!this.element.value) {
              return NaN;
            }

            return this.element.valueAsDate.getTime();
          },
          set: val=> {
            this.element.valueAsDate = new Date(val);
          }
        }
      }
    );

    // Open the picker when the input get focus,
    // also on various click events to capture it in all corner cases.
    const showPicker = ()=> {
      Picker.instance.attachTo(this);
    };
    this.element.addEventListener(`focus`, showPicker);
    this.element.addEventListener(`mousedown`, showPicker);
    this.element.addEventListener(`mouseup`, showPicker);

    // Update the picker if the date changed manually in the input.
    this.element.addEventListener(`keydown`, e=> {
      const date = new Date();

      switch(e.keyCode) {
        case 27:
          Picker.instance.hide();
          break;
        case 38:
          if(this.element.valueAsDate) {
            date.setDate(this.element.valueAsDate.getDate() + 1);
            this.element.valueAsDate = date;
            Picker.instance.pingInput();
          }
          break;
        case 40:
          if(this.element.valueAsDate) {
            date.setDate(this.element.valueAsDate.getDate() - 1);
            this.element.valueAsDate = date;
            Picker.instance.pingInput();
          }
          break;
        default:
          break;
      }

      Picker.instance.sync();
    });
  }

  getLocaleText() {
    const locale = this.locale.toLowerCase();

    for(const localeSet in locales) {
      const localeList = localeSet.split(`_`);
      localeList.map(el=>el.toLowerCase());

      if(
        !!~localeList.indexOf(locale)
        || !!~localeList.indexOf(locale.substr(0,2))
      ) {
        return locales[localeSet];
      }
    }
  }

  // Return false if the browser does not support input[type="date"].
  static supportsDateInput() {
    const input = document.createElement(`input`);
    input.setAttribute(`type`, `date`);

    const notADateValue = `not-a-date`;
    input.setAttribute(`value`, notADateValue);

    return (
      (
        document.currentScript
        && !document.currentScript.hasAttribute(`data-nodep-date-input-polyfill-debug`)
      )
      && !(input.value === notADateValue)
    );
  }

  // Will add the Picker to all inputs in the page.
  static addPickerToDateInputs() {
    // Get and loop all the input[type="date"]s in the page that do not have `[data-has-picker]` yet.
    const dateInputs = document.querySelectorAll(`input[type="date"]:not([data-has-picker])`);
    const length = dateInputs.length;

    if(!length) {
      return false;
    }

    for(let i = 0; i < length; ++i) {
      dateInputs[i].type = 'text';
      new Input(dateInputs[i]);
    }
  }
}
