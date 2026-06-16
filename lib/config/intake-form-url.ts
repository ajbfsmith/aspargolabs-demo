const DEFAULT_INTAKE_FORM_URL = "https://intake.aspargolabs.com";

export const INTAKE_FORM_URL =
  process.env.NEXT_PUBLIC_INTAKE_FORM_URL?.trim() || DEFAULT_INTAKE_FORM_URL;
