// lib/NonfictionTemplates.js

const NonfictionTemplates = {
  'problem-buster': {
    name: 'Problem Buster',
    description:
      'A structured format that walks the reader from problem awareness to a practical solution and troubleshooting.',

    generateOutlinePrompt: (topic) =>
      `Create a practical nonfiction book outline that helps readers solve the problem of "${topic}". Use a structure that includes WHY the topic matters, WHAT it is, several HOW steps to apply the solution, and a WHAT IF section for troubleshooting or variations.`,

    generateOutline: ({ topic, length }) => {
      const charsPerPage = 2400;
      const pageCounts = { short: 20, standard: 50, advanced: 80 };
      const estimatedChars = (pageCounts[length] || 50) * charsPerPage;
      const totalSections = Math.max(5, Math.floor(estimatedChars / 4800));

      const introSections = [
        {
          title: `WHY: Why "${topic}" Matters`,
          notes: `Explain the core problem and why the reader should care.`,
        },
        {
          title: `WHAT: What Is "${topic}"?`,
          notes: `Define the key concept or solution you're introducing.`,
        },
      ];

      const outroSections = [
        {
          title: `WHAT IF: Dealing with Common Challenges`,
          notes: `Offer variations, edge cases, or answers to frequently asked questions.`,
        },
      ];

      const howStepCount =
        totalSections - introSections.length - outroSections.length;
      const howSections = Array.from({ length: howStepCount }, (_, i) => ({
        title: `HOW: Step ${i + 1}`,
        notes: `Describe step ${i + 1} in your solution framework.`,
      }));

      return [...introSections, ...howSections, ...outroSections];
    },
  },

  'how-to-one-solution': {
    name: '11-Page: One Solution',
    description:
      'Ultra-short how-to book presenting one clear solution with steps.',

    generateOutlinePrompt: (topic) =>
      `Create a short how-to guide that addresses the problem of "${topic}" using a single, clear solution. Begin with the problem and promise, introduce the step-by-step method, and conclude with common mistakes and next steps.`,

    generateSections: (length) => {
      const numSteps = length === 'short' ? 3 : length === 'standard' ? 5 : 7;

      return [
        {
          title: 'The Problem',
          notes: 'Describe the main problem the reader is facing.',
        },
        {
          title: 'The Promise',
          notes: 'Preview the core solution and how it will help.',
        },
        { title: 'The Process', notes: 'Introduce the step-by-step method.' },
        ...Array.from({ length: numSteps }, (_, i) => ({
          title: `Step ${i + 1}`,
          notes: `Explain step ${i + 1} in the process.`,
        })),
        {
          title: 'Common Mistakes',
          notes: 'Briefly list 2–3 mistakes readers should avoid.',
        },
        {
          title: 'Next Steps',
          notes: 'Help the reader take immediate action or go deeper.',
        },
      ];
    },
  },

  'how-to-multi-solution': {
    name: '11-Page: Multiple Solutions',
    description: 'Presents several different solutions to the same problem.',

    generateOutlinePrompt: (topic) =>
      `Create a compact how-to book outline for solving "${topic}" using multiple possible solutions. Include several different approaches, each with a few steps, and help the reader choose between them.`,

    generateSections: (length) => {
      const numSolutions =
        length === 'short' ? 2 : length === 'standard' ? 3 : 5;
      const stepsPerSolution =
        length === 'short' ? 1 : length === 'standard' ? 2 : 3;

      const sections = [
        {
          title: 'The Problem',
          notes: 'Define the core issue the reader is facing.',
        },
        {
          title: 'Overview of Solutions',
          notes: 'Preview the different approaches or options.',
        },
      ];

      for (let i = 1; i <= numSolutions; i++) {
        sections.push({
          title: `Solution ${i}`,
          notes: `Introduce solution ${i} and its key idea.`,
        });
        for (let j = 1; j <= stepsPerSolution; j++) {
          sections.push({
            title: `Solution ${i} - Step ${j}`,
            notes: `Explain step ${j} for solution ${i}.`,
          });
        }
      }

      sections.push(
        { title: 'Quick Recap', notes: 'Summarize all the solutions briefly.' },
        {
          title: 'What to Try First',
          notes: 'Help the reader decide where to begin.',
        }
      );

      return sections;
    },
  },

  'list-long': {
    name: 'Listicle (Long List)',
    description:
      'Organizes the book around a long list of items, ideas, or resources with short explanations.',

    generateOutlinePrompt: (topic) =>
      `Create a nonfiction book outline that explores "${topic}" through a long list format. Include an intro, 20–50 list items (based on book length), and a conclusion that ties everything together.`,

    getSections: (topic, estimatedSections) => {
      const base = [
        {
          title: `Introduction to "${topic}"`,
          notes:
            'Introduce the topic and what readers will get from this list book.',
        },
      ];

      const listItems = Array.from({ length: estimatedSections }, (_, i) => ({
        title: `Item ${i + 1}`,
        notes: 'Describe the item in one or two sentences.',
      }));

      const end = [
        {
          title: 'Conclusion',
          notes:
            'Summarize the key takeaways from the list and encourage action or reflection.',
        },
      ];

      return [...base, ...listItems, ...end];
    },
  },

  'list-short': {
    name: 'Listicle (Short Items)',
    description:
      'Each list item is described in depth. Best for highly engaging, example-driven content.',

    generateOutlinePrompt: (topic) =>
      `Create a nonfiction list book outline for the topic "${topic}". Include an introduction, a series of 10–20 detailed list items, and a conclusion to wrap it up.`,

    getSections: (topic, estimatedSections) => {
      const base = [
        {
          title: `Introduction to "${topic}"`,
          notes: 'Introduce the topic and hook the reader with what’s to come.',
        },
      ];

      const items = Array.from({ length: estimatedSections }, (_, i) => ({
        title: `Item ${i + 1}`,
        notes:
          'Describe this item in 1–2 paragraphs. Include examples or details.',
      }));

      const end = [
        {
          title: 'Conclusion',
          notes:
            'Wrap up the list with a final summary, reflection, or recommendation.',
        },
      ];

      return [...base, ...items, ...end];
    },
  },

  'sales-copy': {
    name: 'Sales Copy Formula',
    description:
      'A persuasive structure for sales pages and promotional copy based on emotional hooks, empathy, and benefit-driven storytelling.',

    generateOutlinePrompt: (topic) =>
      `Generate an outline for persuasive sales copy for a product or idea related to "${topic}". Follow a flow from emotional hooks to benefits and objections, ending in a clear call to action.`,

    generateSections: (length) => {
      const extra = length === 'advanced' ? 2 : length === 'standard' ? 1 : 0;

      const baseSections = [
        {
          title: `Big Promise: How [Your Topic] Will Change Your Life`,
          notes: 'Lead with the main benefit. Make it bold and emotional.',
        },
        {
          title: `Empathy: I’ve Been Where You Are`,
          notes: 'Describe the struggle. Build emotional connection.',
        },
        {
          title: 'Twist the Knife (Gently)',
          notes: 'Highlight the cost of inaction. Increase urgency.',
        },
        {
          title: 'The Good News: There’s a Simple Solution',
          notes: 'Introduce the product/idea as the solution.',
        },
        {
          title: 'What You’ll Gain: Key Benefits',
          notes: 'Bullet point list of emotional and practical benefits.',
        },
        {
          title: 'Reassurance + Ask Again',
          notes: 'Handle objections. Ask again for action.',
        },
      ];

      const optionalSections = [
        {
          title: 'Mini Case Study or Testimonial',
          notes: 'Prove it works with a real example.',
        },
        {
          title: 'Recap & Close',
          notes: 'Summarize and build final momentum to act.',
        },
      ];

      return [...baseSections, ...optionalSections.slice(0, extra)];
    },
  },
};

export default NonfictionTemplates;
