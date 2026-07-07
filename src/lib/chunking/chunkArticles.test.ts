import { describe, it, expect } from "vitest"
import { chunkArticles } from "./chunkArticles"

describe("chunkArticles", () => {
  describe("no h2 elements", () => {
    it("returns all text as a single chunk when there are no h2 elements", () => {
      const html = `
                <p>This is the intro paragraph.</p>
                <p>Another paragraph with some text.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(1)
      expect(result[0]).toContain("This is the intro paragraph.")
      expect(result[0]).toContain("Another paragraph with some text.")
    })

    it("returns empty array when main has no text content", () => {
      const html = `
                <div></div>
                <img src="test.jpg" />
              
      `
      const result = chunkArticles(html)
      expect(result).toEqual([])
    })

    it("returns empty array when main is empty", () => {
      const html = `
            </article>
          </body>
        </html>
      `
      const result = chunkArticles(html)
      expect(result).toEqual([])
    })
  })

  describe("text before first h2", () => {
    it("includes text before the first h2 as its own chunk", () => {
      const html = `
                <p>Introduction text that appears before any heading.</p>
                <h2>First Heading</h2>
                <p>Content after first heading.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(2)
      expect(result[0]).toContain(
        "Introduction text that appears before any heading.",
      )
      expect(result[1]).toContain("First Heading")
      expect(result[1]).toContain("Content after first heading.")
    })

    it("handles empty text before first h2", () => {
      const html = `
                <h2>First Heading</h2>
                <p>Content after first heading.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(1)
      expect(result[0]).toContain("First Heading")
    })
  })

  describe("single h2 element", () => {
    it("returns the h2 heading with its content", () => {
      const html = `
                <h2>My Section</h2>
                <p>Some content in this section.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(1)
      expect(result[0]).toContain("My Section")
      expect(result[0]).toContain("Some content in this section.")
    })
  })

  describe("multiple h2 elements", () => {
    it("splits content by each h2 heading", () => {
      const html = `
                <h2>Section One</h2>
                <p>Content for section one.</p>
                <h2>Section Two</h2>
                <p>Content for section two.</p>
                <h2>Section Three</h2>
                <p>Content for section three.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(3)
      expect(result[0]).toContain("Section One")
      expect(result[0]).toContain("Content for section one.")
      expect(result[1]).toContain("Section Two")
      expect(result[1]).toContain("Content for section two.")
      expect(result[2]).toContain("Section Three")
      expect(result[2]).toContain("Content for section three.")
    })

    it("handles h2 elements with no content between them", () => {
      const html = `
                <h2>Section One</h2>
                <p>Content for section one.</p>
                <h2>Section Two</h2>
                <h2>Section Three</h2>
                <p>Content for section three.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(3)
      expect(result[1]).toBe("Section Two")
    })

    it("handles h2 elements with no content after the last one", () => {
      const html = `
                <h2>Section One</h2>
                <p>Content for section one.</p>
                <h2>Section Two</h2>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(2)
      expect(result[1]).toBe("Section Two")
    })

    it("includes multiple paragraphs within a section", () => {
      const html = `
                <h2>Section One</h2>
                <p>First paragraph.</p>
                <p>Second paragraph.</p>
                <div>
                  <p>Nested paragraph.</p>
                </div>
                <h2>Section Two</h2>
                <p>Content for section two.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(2)
      expect(result[0]).toContain("First paragraph.")
      expect(result[0]).toContain("Second paragraph.")
      expect(result[0]).toContain("Nested paragraph.")
      expect(result[1]).toContain("Content for section two.")
    })
  })

  describe("heading text cleanup", () => {
    it("trims heading text", () => {
      const html = `
                <h2>   Trimmed Heading   </h2>
                <p>Content.</p>
              
      `
      const result = chunkArticles(html)
      // Heading text should be trimmed (no leading/trailing whitespace)
      expect(result[0]).toMatch(/^Trimmed Heading\n\nContent\.$/)
    })
  })

  describe("whitespace normalization", () => {
    it("reduces excessive newlines to double newlines", () => {
      const html = `
                <h2>Section</h2>
                <p>Para 1</p>
                <p>Para 2</p>
                <p>Para 3</p>
                <h2>Section Two</h2>
                <p>Content.</p>
              
      `
      const result = chunkArticles(html)
      // Should not contain triple or more consecutive newlines
      for (const chunk of result) {
        expect(chunk).not.toMatch(/\n{3,}/)
      }
    })

    it("trims each chunk", () => {
      const html = `
                <h2>Section</h2>
                <p>Content.</p>
              
      `
      const result = chunkArticles(html)
      expect(result[0]).toBe(result[0].trim())
    })
  })

  describe("edge cases", () => {
    it("handles deeply nested content within h2 sections", () => {
      const html = `
                <h2>Complex Section</h2>
                <div>
                  <section>
                    <article>
                      <p>Deeply nested content.</p>
                    </article>
                  </section>
                </div>
                <h2>Next Section</h2>
                <p>Next content.</p>
              
      `
      const result = chunkArticles(html)
      expect(result).toHaveLength(2)
      expect(result[0]).toContain("Deeply nested content.")
      expect(result[1]).toContain("Next content.")
    })

    it("handles h2 with inline elements", () => {
      const html = `
                <h2><strong>Bold</strong> and <em>italic</em> heading</h2>
                <p>Content.</p>
              
      `
      const result = chunkArticles(html)
      expect(result[0]).toContain("Bold and italic heading")
    })
  })

  describe("real world", () => {
    it("works on a real blog article", () => {
      const html = `<p>I want to talk about short circuiting in programming. It is something that doesn’t really get talked about much, but is incredibly important to understand. Before I jump any further into why it is important, I need to define what short circuiting is.</p>
<h2 id="what-is-short-circuiting-circuiting">What Is Short Circuiting Circuiting?</h2>
<p>Short circuiting is a technique that many programming languages use when evaluating boolean logic (<code>&amp;&amp;</code>, <code>||</code>) to save computing power by skipping unnecessary parts of boolean logic. This is a pretty vague definition, so in order to explain exactly what short circuiting is I want to give some examples. Imagine you have some boolean logic in your code that looks like this <code>true || false</code> . We know that by looking at this the result will be <code>true</code>, but a computer needs to take the execution of this statement piece by piece. This means the computer will look at the first part of the statement which is <code>true</code> then the second part which is <code>||</code> and then finally the last section which is <code>false</code>. The first part is easy for the computer since it just sees that it is <code>true</code> and it can move onto the second part which is <code>||</code>. This is where the computer does something smart and actually short circuits out of the boolean logic. The computer knows that <code>true || anything</code> is always <code>true</code>, and thus it will skip checking the third part of our statement since it knows that no matter what the third part is the result is <code>true</code>. This works the same way with <code>&amp;&amp;</code> as well. For example a computer knows that <code>false &amp;&amp; anything</code> is always <code>false</code> so in a statement like this <code>false &amp;&amp; true</code> the computer will skip the third part since it already knows the answer is <code>false</code>.</p>
<h2 id="why-use-short-circuiting">Why Use Short Circuiting?</h2>
<p>Now from these examples you are probably thinking this is pretty pointless, but short circuiting allows you to do some really nifty conditional logic. If you have ever worked with React you have probably seen code like this <code>isLoaded &amp;&amp; renderContent()</code> . I have used code like this many times in my YouTube videos and <a href="https://courses.webdevsimplified.com/learn-react-today">React course</a>, because it allows us to render content conditionally without having to use an if statement. If we break this code down further we can see that if <code>isLoaded</code> is <code>false</code> then the computer will skip the last part and never call <code>renderContent()</code> since it knows that <code>false &amp;&amp; anything</code> is <code>false</code>. Essentially this code is exactly the same as <code>if (isLoaded) renderContent()</code>, but it is more concise.</p>
<p>React is not the only use case for short circuiting, though. Another, even more common, use case is when you want to assign a default value to a variable. This can be done by doing this <code>const variable = variableValue || 'default'</code> . This code will assign <code>variable</code> to <code>variableValue</code> if it exists or if <code>variableValue</code> does not exist it will set it to <code>'default'</code>. This again works via short circuiting since the computer will look at the first section <code>variableValue</code> and if it is something that evaluates to <code>true</code>, such as an object, then the computer will skip the <code>'default'</code> section of the boolean logic. If <code>variableValue</code> evaluates to <code>false</code>, though, the computer cannot skip anything and it will thus set the variable to <code>'default'</code>. This is essentially the same as the following code.</p>
<pre class="shiki dark-plus" style="background-color:#1E1E1E" tabindex="0"><code><span class="line"><span style="color:#569CD6">let</span><span style="color:#D4D4D4"> </span><span style="color:#9CDCFE">variable</span><span style="color:#D4D4D4"> = </span><span style="color:#CE9178">"default"</span></span>
<span class="line"><span style="color:#C586C0">if</span><span style="color:#D4D4D4"> (</span><span style="color:#9CDCFE">variableValue</span><span style="color:#D4D4D4">) </span><span style="color:#9CDCFE">variable</span><span style="color:#D4D4D4"> = </span><span style="color:#9CDCFE">variableValue</span></span></code></pre>
<p>While these are the most common use cases of short circuiting it is by no means the full list. There are tons of use cases for short circuiting as a way to make your code cleaner and easier to write, but they all revolve around the concepts of the two examples in this email.</p>`

      const result = chunkArticles(html)
      expect(result[0]).toContain(
        "I want to talk about short circuiting in programming. It is something that doesn’t really get talked about much, but is incredibly important to understand. Before I jump any further into why it is important, I need to define what short circuiting is.",
      )
      expect(result[1]).toContain("What Is Short Circuiting Circuiting?")
      expect(result[1]).toContain(
        "The computer knows that true || anything is always true, and thus it will skip checking the third part of our statement since it knows that no matter",
      )
    })
  })
})
