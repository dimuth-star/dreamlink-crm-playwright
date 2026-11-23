// After a SurveyJS "Select File": Android may show a chooser (Camera / Photos & videos), the Files picker
// (Recent files grid) or the system Photo Picker (media grid). Always take the first existing image;
// never the camera.
const { MOBILE, MOBILE_TIMEOUTS } = require("../../../common/mobileSelectors");
const { BasePage } = require("../BasePage");

class GalleryPicker extends BasePage {
  async pickFirstImage() {
    const states = {
      chooser: MOBILE.chooserGallery,
      files: MOBILE.filesPickerFirstItem,
      photos: MOBILE.photoPickerFirstItem,
    };
    let found = await this.waitForAny(
      Object.values(states),
      MOBILE_TIMEOUTS.default,
    );
    if (found === states.chooser) {
      await this.tap(states.chooser);
      found = await this.waitForAny(
        [states.files, states.photos],
        MOBILE_TIMEOUTS.default,
      );
    }
    await this.tap(found);
    for (const confirm of MOBILE.pickerConfirmBtns) {
      if (await this.exists(confirm)) {
        await this.tap(confirm);
        break;
      }
    }
  }
}

module.exports = { GalleryPicker };
