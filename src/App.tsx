import { useRef, useState, type KeyboardEvent } from "react";

import { parseMarkdown } from "./util/parse";
import MainHeader from "./components/Header/MainHeader";

function App() {
  const [markdownOutput, setMarkdownOutput] = useState("");

  const textEditorRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Tab") {
      event.preventDefault();

      const textarea = textEditorRef.current;
      const indent = "    ";

      if (textarea) {
        const cursorPosition = textarea?.selectionStart;

        textarea.value =
          textarea?.value.slice(0, cursorPosition) +
          indent +
          textarea?.value.slice(cursorPosition);

        textarea.selectionStart = cursorPosition + indent.length;
        textarea.selectionEnd = cursorPosition + indent.length;

        setMarkdownOutput(parseMarkdown(textarea.value));
      }
    }
  }

  function handleChange() {
    if (textEditorRef.current) {
      setMarkdownOutput(parseMarkdown(textEditorRef.current.value));
    }
  }

  return (
    <div className="h-dvh">
      <MainHeader />

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 h-(--screen-height)">
        <div>
          <textarea
            ref={textEditorRef}
            name="editor"
            id="editor"
            className="border border-slate-600 p-4 bg-slate-50 outline-0 rounded-md shadow-xl resize-none w-full h-full"
            placeholder="↓ Enter Markdown text here ↓"
            autoFocus
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          ></textarea>
        </div>

        <div
          className="markdown-body text-wrap overflow-x-hidden"
          dangerouslySetInnerHTML={{ __html: markdownOutput }}
        />
      </main>
    </div>
  );
}

export default App;
