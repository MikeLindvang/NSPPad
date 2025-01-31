export const Highlight = Mark.create({
  name: 'highlight',
  addAttributes() {
    return {
      'data-highlight': {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-highlight]',
        getAttrs: (dom) => {
          if (!dom.hasAttribute('data-highlight')) return false;
          return { 'data-highlight': dom.getAttribute('data-highlight') };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    if (!HTMLAttributes || !HTMLAttributes['data-highlight']) {
      return ['span', {}, 0]; // ✅ Prevents undefined error
    }
    return ['span', { ...HTMLAttributes, class: 'bg-yellow-300' }, 0];
  },
  addCommands() {
    return {
      setHighlight:
        (id) =>
        ({ commands }) => {
          return commands.setMark(this.name, { 'data-highlight': id });
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
