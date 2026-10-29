import { Accordion } from "radix-ui";

/**
 * The FAQ is the one part of the landing page that keeps real component state,
 * so it uses Radix Accordion rather than the native <details> element the
 * static version used. The surrounding markup and copy are unchanged.
 */
const ITEMS = [
  {
    value: "read-pages",
    question: "Does Jotty read the pages I visit?",
    answer: (
      <>
        <p>
          It reads the title, the address and, on YouTube, the channel name. Not the body, not
          form fields, not passwords, not screenshots. Those three fields are compared locally
          with the task you typed.
        </p>
        <p>
          The content script has to run on every page for that to work during a session. With no
          session running, it asks the service worker one question and stops.
        </p>
      </>
    ),
  },
  {
    value: "api-key",
    question: "Do I need a YouTube API key?",
    answer: (
      <>
        <p>
          Only for search inside the Focus Player. The key is free from Google Cloud, lives in{" "}
          <code>chrome.storage.local</code>, and is read only by the service worker. One search
          costs about 101 of the 10,000 free daily units.
        </p>
        <p>
          There is a <a href="guides/youtube-data-api-key/">step-by-step guide to creating the key</a>.
          Everything else in Jotty works without it.
        </p>
      </>
    ),
  },
  {
    value: "block-youtube",
    question: "Does it block YouTube completely?",
    answer: (
      <>
        <p>
          No, and that is deliberate. YouTube is where a lot of the explanation lives. Jotty keeps
          it available, judges each page against the task, and nudges when the page is related but
          off task.
        </p>
        <p>
          If you want friction, add YouTube to the site list and turn on the delay. Strict mode
          removes the override for the length of a session. You can always end the session; the
          point is that ending it is a decision, not a reflex.
        </p>
      </>
    ),
  },
  {
    value: "ignore-nudge",
    question: "What happens if I ignore the nudge?",
    answer: (
      <p>
        Nothing punitive. The time is logged as drift, and the page becomes one of the things Jotty
        asks about the next morning. Ignoring a nudge is data, not a failure.
      </p>
    ),
  },
  {
    value: "free",
    question: "Is it free?",
    answer: (
      <p>
        Yes. Jotty is MIT licensed, has no ads, no paid tier and no account. There is nothing to
        subscribe to. If you use the Focus Player search, you pay Google in quota, not money, on the
        free tier.
      </p>
    ),
  },
  {
    value: "data",
    question: "Where is my data stored, and how do I delete it?",
    answer: (
      <p>
        In <code>chrome.storage.local</code> in your browser profile. Settings → Your data exports a
        readable JSON file or deletes everything, including the API key. Uninstalling the extension
        also removes its storage.
      </p>
    ),
  },
  {
    value: "sharing",
    question: "Can I use it with a tutor, parent or study group?",
    answer: (
      <p>
        Not yet. There is no sharing, no leaderboard and no remote dashboard. The log is local by
        design. If sharing exists later, it will be opt-in and it will be a file you choose to send.
      </p>
    ),
  },
];

export function FaqSection() {
  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head">
          <span className="section-number">?</span>
          <h2>Questions people ask before installing.</h2>
        </div>

        <Accordion.Root className="faq-list" type="single" collapsible>
          {ITEMS.map((item) => (
            <Accordion.Item className="faq-item" key={item.value} value={item.value}>
              <Accordion.Header className="faq-header">
                <Accordion.Trigger className="faq-trigger">{item.question}</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="faq-content">
                <div className="answer">{item.answer}</div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
