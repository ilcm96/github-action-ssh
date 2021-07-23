export const keyboardFunction = password => (
  name: any,
  instructions: any,
  instructionsLang: any,
  prompts: string | any[],
  finish: (arg0: any[]) => void
) => {
  if (
    prompts.length > 0 &&
    prompts[0].prompt.toLowerCase().includes("password")
  ) {
    finish([password]);
  }
};
