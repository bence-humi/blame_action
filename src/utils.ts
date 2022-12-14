import githubUsername from "github-username";
import * as core from "@actions/core";

export interface Change {
  from: number;
  to: number;
  file: string;
}

/**
 * Returns the author emails of blame response
 * @param blame the blame response
 */
export const parseBlame = (blame: string): string[] => {
  const foundMails = blame.match(/author-mail <.*?>/g);
  if (!foundMails) return [];
  return [
    ...new Set(foundMails.map(mail => mail.substr(13, mail.length - 14)))
  ];
};

/**
 * Parses the git diff output to a list of Change objects
 * @param diff the diff output
 */
export const parseDiff = (diff: string): Change[] => {
  //Splits the diff for each document
  const diffs = diff.split("diff --git");
  const changes: Change[] = [];

  for (let i = 0; i < diffs.length; i++) {
    console.log("we are in diffs, i-th diff: ", diffs[i]);
    //Finds the file name
    const matchFile = diffs[i].match(/--- a\/.*\n/);
    console.log("found a potential matchFile: ", matchFile);
    //Finds the line which specifies which rows are modified
    const lines = diffs[i].match(/@@ -[0-9]*,[0-9]* \+[0-9]*,[0-9]* @@/g);
    console.log("found the lines: ", lines);

    if (!lines || !matchFile) continue;
    const file = matchFile[0].substr(6, matchFile[0].length - 7);

    //@@ -20,3 +20,4 @@ -> {from: 20, to: 23}
    for (let l = 0; l < lines.length; l++) {
      const startLine = lines[l].match(/@@ -[0-9]*/);
      const steps = lines[l].match(/,[0-9]* \+/);
      if (!startLine || !steps) continue;

      const from = Number(startLine[0].substr(4));
      const to = Number(steps[0].substr(1, steps[0].length - 3)) + from;
      changes.push({
        file: file,
        from: from,
        to: to
      });
    }
  }

  return changes;
};

/**
 * Turns github emails into github usernames
 * @param emails of github users
 * @returns the usernames of the users with the specified emails
 */
export const getUserNames = async (emails: string[]): Promise<string[]> => {
  const userNames: string[] = [];
  for (let i = 0; i < emails.length; i++) {
    const username = await githubUsername(emails[i]).catch(err =>
      handle("Unable to fetch username", err, "")
    );
    userNames.push(typeof(username) == "string" ? username : "");
  }
  return [...new Set(userNames)];
};

export const handle = <T>(message: string, err: string, catchValue: T): T => {
  core.debug(message);
  core.debug(err);
  return catchValue;
};
