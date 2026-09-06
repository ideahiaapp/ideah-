import { Slide01Cover } from "./Slide01Cover";
import { Slide02Question } from "./Slide02Question";
import { Slide03BehindTouch } from "./Slide03BehindTouch";
import { Slide04NotEnoughTechnique } from "./Slide04NotEnoughTechnique";
import { Slide05WhyInitiation } from "./Slide05WhyInitiation";
import { Slide06FromExperienceToPath } from "./Slide06FromExperienceToPath";
import { Slide07Journey } from "./Slide07Journey";
import { Slide08Hours } from "./Slide08Hours";
import { Slide09SixAxes } from "./Slide09SixAxes";
import { Slide10Immersion } from "./Slide10Immersion";
import { Slide11ElevenPeople } from "./Slide11ElevenPeople";
import { Slide12ForWhom } from "./Slide12ForWhom";
import { Slide13NotForWhom } from "./Slide13NotForWhom";
import { Slide14Included } from "./Slide14Included";
import { Slide15Investment } from "./Slide15Investment";
import { Slide16GoDeeper } from "./Slide16GoDeeper";
import { Slide17Closing } from "./Slide17Closing";

// A ordem aqui precisa espelhar exatamente SLIDE_META em lib/slideMeta.ts.
export const SLIDES = [
  Slide01Cover,
  Slide02Question,
  Slide03BehindTouch,
  Slide04NotEnoughTechnique,
  Slide05WhyInitiation,
  Slide06FromExperienceToPath,
  Slide07Journey,
  Slide08Hours,
  Slide09SixAxes,
  Slide10Immersion,
  Slide11ElevenPeople,
  Slide12ForWhom,
  Slide13NotForWhom,
  Slide14Included,
  Slide15Investment,
  Slide16GoDeeper,
  Slide17Closing,
] as const;
