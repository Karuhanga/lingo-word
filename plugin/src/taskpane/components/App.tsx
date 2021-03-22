/* global Button Header, HeroList, HeroListItem, Progress, Word */
import * as React from "react";
import Header from "./Header";
import WrongWordList, {WrongWord} from "./WrongWordList";
import Progress from "./Progress";
import {useState} from "react";
import useInterval from "@use-it/interval";

// images references in the manifest
import "../../../assets/icon-16.png";
import "../../../assets/icon-32.png";
import "../../../assets/icon-80.png";
import {fixAnsiUtf8Issue} from "../../utils";

export interface AppProps {
  title: string;
  isOfficeInitialized: boolean;
}

export default function App({ title, isOfficeInitialized }: AppProps) {
  const [words, setWords] = useState([]);
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [checking, setChecking] = useState(false);
  const [debug] = useState("");

  if (!isOfficeInitialized) {
    return (
        <Progress title={title} logo="assets/logo.png" message="Please sideload your addin to see app body." />
    );
  }

  function removeWord(wrongWord: string) {
    setWrongWords(wrongWords.filter(word => word.wrong !== wrongWord));
  }

  function runCheckSpelling() {
    if (!checking) {
      setChecking(true);
      checkSpellings(words)
          .then(newWrongWords => {
            setWrongWords(uniqueWrongWords([...wrongWords, ...newWrongWords]));
          })
          .finally(() => setChecking(false));
    }
  }

  useInterval(() => getWords().then(setWords), 5000);
  useInterval(() => runCheckSpelling(), 5000);

  return (
      <div className="ms-welcome">
        {debug}
        <Header logo="assets/logo.png" title={title} message="Spell Checker" />
        <WrongWordList
            message="Possible misspellings"
            recheckDisabled={checking}
            recheck={() => getWords().then(setWords).then(runCheckSpelling)}
            items={wrongWords}
            removeWord={removeWord}
        />
      </div>
  );
}

function checkSpellings(toCheck: string[]): Promise<WrongWord[]> {
  return Promise.resolve(toCheck.map(word => ({wrong: word, suggestions: ["as", "fg"]})));
}

function getWords(setDebug?) {
  return Word.run(async context => {
    const doc = context.document.body.getHtml();
    await context.sync();
    const docContent = fixAnsiUtf8Issue(doc.value);

    const htmlContent = new DOMParser().parseFromString(docContent, "text/html").body.innerText;
    if (setDebug) setDebug(docContent);
    return unique(removeSpaces(htmlContent.toLowerCase().split(/\s+/)));
  });
}

function unique(arr: string[]) {
  const u = {};
  return arr.filter((v) => {
    return u[v] = !u.hasOwnProperty(v);
  });
}

function uniqueWrongWords(arr: WrongWord[]) {
  const u = {};
  return arr.filter((v) => {
    return u[v.wrong] = !u.hasOwnProperty(v.wrong);
  });
}

function removeSpaces(words: string[]) {
  return words.map(word => word.trim()).filter(word => !!word);
}
