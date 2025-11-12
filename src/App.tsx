import { useState, type ChangeEvent } from "react";

import { parseMarkdown } from "./util/parse";
import MainHeader from "./components/Header/MainHeader";

function App() {
  const [markdownOutput, setMarkdownOutput] = useState("");

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const output = parseMarkdown(event.target.value);
    // console.log(JSON.stringify(output));
    setMarkdownOutput(output);
  }

  return (
    <>
      <MainHeader />

      <div className="grid grid-cols-2 gap-8 p-8">
        <div>
          <textarea
            name="editor"
            id="editor"
            className="border border-slate-600 p-4 bg-slate-50 outline-0 rounded-md shadow-xl resize-none w-full h-screen"
            rows={20}
            autoFocus
            onChange={handleChange}
          ></textarea>
        </div>

        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: markdownOutput }}
        ></div>
      </div>
    </>
  );
}

export default App;
