export function assemblePresentation(llmOutput: string): string {
  let html = llmOutput.trim();

  // Strip any markdown code fences the LLM might have added
  if (html.startsWith("```")) {
    html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
  }

  // Ensure it starts with DOCTYPE
  if (!html.toLowerCase().startsWith("<!doctype")) {
    html = "<!DOCTYPE html>\n" + html;
  }

  // Ensure it ends with </html>
  if (!html.toLowerCase().includes("</html>")) {
    html += "\n</html>";
  }

  return html;
}
