import { log } from "./logging";

const UNORDERED_LIST_PARSE_RULES: [RegExp, string] = [
  /(((?<![ ]{4})(^|\n)- .+?)+)(?=$|\n\n[ ]{0,3}(\w|[#*>]))/gs,
  "<ul>$1</ul>",
];

const LIST_ITEM_PARSE_RULES: [RegExp, string] = [
  /(^|\n)- (.+?)(?=$|\n-|\n\n|<\/)/gs,
  "<li>$2</li>",
];

const ORDERED_LIST_PARSE_RULES: [RegExp, string] = [
  /(((?<![ ]{4})(^|\n)\d+\. .+?)+)(?=$|\n\n[ ]{0,3}(\w|[#*>]|<ul|<ol))/gs,
  "<ol>$1</ol>",
];

const ORDERED_LIST_ITEM_PARSE_RULES: [RegExp, string] = [
  /(^|\n)\d+\. (.+?)(?=$|\n\d+|\n\n|<\/)/gs,
  "<li>$2</li>",
];

const BLOCKQUOTE_PARSE_RULES: [RegExp, string] = [
  /(((^|\n)>[ ]?.+?)+)(?=\n\n|$)/gs,
  "<blockquote>$1</blockquote>",
];

const PARSE_RULES: [RegExp, string][] = [
  [
    /```[a-zA-Z.0-9#-]*\n(.+?)```/gs,
    "<pre class='bg-slate-100 rounded-md p-4 text-sm overflow-x-scroll'><code>$1</code></pre>",
  ],

  [/^#{6} (.+)/gm, "<h6>$1</h6>"],
  [/^#{5} (.+)/gm, "<h5>$1</h5>"],
  [/^#{4} (.+)/gm, "<h4>$1</h4>"],
  [/^#{3} (.+)/gm, "<h3>$1</h3>"],
  [/^#{2} (.+)/gm, "<h2>$1</h2>"],
  [/^# (.+)/gm, "<h1>$1</h1>"],

  [/^\*{3}$/gm, "<hr/>"],

  [/\n\n([^<].*?)(?=<|\n\n|$)/gs, "<p>$1</p>"],
  [/^([^<].*?)(?=<|$)/gs, "<p>$1</p>"],

  [/[ ]{2}$/gm, "<br>"],

  [/\*\*(.+?)\*\*/g, "<strong>$1</strong>"],
  [/__(.+?)__/g, "<strong>$1</strong>"],
  [/\*(.+?)\*/g, "<em>$1</em>"],
  [/_(.+?)_/g, "<em>$1</em>"],

  [/`(.+?)`/g, "<code>$1</code>"],

  [/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>'],
];

function parseList(inputText: string, mode: string) {
  let output = inputText;

  const listPattern =
    mode === "ol" ? ORDERED_LIST_PARSE_RULES[0] : UNORDERED_LIST_PARSE_RULES[0];
  const listMatches = output.match(listPattern);
  const listMatchGroups = output.matchAll(listPattern);

  if (listMatches) {
    // log(`Matched ${mode} List`);
    // console.log(listMatches);
    const listMatchGroupElement = [...listMatchGroups].reverse();

    for (const matchIdx in listMatches.reverse()) {
      // Surround match with <ol> or <ul>, prepend a \n to retain a delimiter if present
      const newLineDelimiter = listMatches[matchIdx][0] === "\n" ? "\n" : "";

      let parsedListBlock = `${newLineDelimiter}<${mode}>${listMatches[matchIdx]}</${mode}>`;
      // console.log("Parsed List Block", parsedListBlock);

      // console.log(`Captured ${mode}: `, JSON.stringify(output));

      const listItemPattern =
        mode === "ol"
          ? ORDERED_LIST_ITEM_PARSE_RULES[0]
          : LIST_ITEM_PARSE_RULES[0];

      const listItemMatches = listMatches[matchIdx].matchAll(listItemPattern);
      const listItemMatchGroups = [...listItemMatches];

      if (listItemMatchGroups.length > 0) {
        // log(`Matched ${mode} ListItem`);
        // console.log(listItemMatchGroups);

        for (const listItemMatchIdx in listItemMatchGroups) {
          const currentListItem = listItemMatchGroups[listItemMatchIdx];

          // log("Current list item");
          // console.log(currentListItem);
          // console.log(listItemMatchIdx, JSON.stringify(currentListItem[0]));

          // Surround match with <li>
          parsedListBlock = parsedListBlock.replace(
            currentListItem[0],
            `<li>${currentListItem[2]}</li>`
          );
          // console.log("Parsed list item block", parsedListBlock);

          const nestedListItemMatches =
            currentListItem[0].match(/(\n[ ]{4}(.+))+/g);

          if (nestedListItemMatches) {
            // log(`Matched Nested Content in ${mode} List:`);
            // console.log(nestedListItemMatches);
            const nestedListItemContent = nestedListItemMatches[0]
              .trimStart()
              .replace(/^[ ]{4}/gm, "");

            parsedListBlock = parsedListBlock.replace(
              nestedListItemMatches[0],
              parseMarkdown(nestedListItemContent)
            );
          }
        }
      }

      const listMatchIndex = listMatchGroupElement[matchIdx].index;
      // console.log("Index", listMatchIndex);
      const listMatchLength = listMatchGroupElement[matchIdx][0].length;
      // console.log("Match length", listMatchLength);

      // Cannot use string replace, as it might replace an unintended match
      // Cannot use regex replace, due to global flag in pattern, and also due to nested content
      // Using the match index & length to replace Markdown block
      output =
        output.slice(0, listMatchIndex) +
        parsedListBlock +
        output.slice(listMatchIndex + listMatchLength);
      // log("Final parsed list");
      // console.log(output);
    }
  }

  return output;
}

/*
Blockquote content is itself a Markdown input.
Need to convert the content to HTML according to same rules above.
For blockquotes:
|=> - need to grab all the consecutive lines preceded by >
|   - strip the preceding "> " indicator characters
|   - pass this intermediate to parseMarkdown
- repeat process recursively
*/
function parseBlockquote(inputText: string) {
  let output = inputText;

  const blockquotePattern = BLOCKQUOTE_PARSE_RULES[0];
  const blockquoteTarget = BLOCKQUOTE_PARSE_RULES[1];
  const blockquoteMatches = output.match(blockquotePattern);

  if (blockquoteMatches) {
    // log("Matched Blockquotes");
    // console.log(blockquoteMatches);
    for (const matchIdx in blockquoteMatches) {
      // console.log("Blockquotes: ", blockquoteMatches[matchIdx]);

      // Trim the blockquote indicators at the start of each line
      const blockquoteInnerContent = blockquoteMatches[matchIdx].replaceAll(
        /^>[ ]?/gm,
        ""
      );
      const parsedBlockquote = parseMarkdown(blockquoteInnerContent);
      output = output.replace(
        blockquoteMatches[matchIdx],
        blockquoteTarget.replace("$1", parsedBlockquote)
      );
    }
  }

  return output;
}

export function parseMarkdown(inputText: string) {
  let output = inputText;

  output = parseList(output, "ul");
  output = parseList(output, "ol");
  output = parseBlockquote(output);

  for (const [pattern, target] of PARSE_RULES) {
    // const match = output.match(pattern);
    // if (match) {
    //   log("Matched pattern: " + pattern.toString());
    //   console.log(match);
    // }
    output = output.replace(pattern, target);
  }

  return output;
}
