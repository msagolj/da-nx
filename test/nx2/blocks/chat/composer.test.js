import { expect } from '@esm-bundle/chai';
import { setConfig } from '../../../../nx2/scripts/nx.js';
import { loadStyle } from '../../../../nx2/utils/utils.js';

await setConfig({ hostnames: [] });
await import('../../../../nx2/blocks/chat-ao/input.js');

const tokens = await loadStyle(new URL('../../../../nx2/styles/styles.css', import.meta.url).href);

describe('expanded AO input appearance', () => {
  let host;
  let frame;
  let surface;
  let input;

  before(() => {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, tokens];
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((sheet) => sheet !== tokens);
  });

  beforeEach(async () => {
    host = document.createElement('div');
    host.style.width = '664px';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<nx-ao-input variant="expanded" showinputstatus></nx-ao-input>';
    document.body.append(host);
    input = root.querySelector('nx-ao-input');
    await input.updateComplete;
    frame = input.shadowRoot.querySelector('.chat-form');
    surface = input.shadowRoot.querySelector('.chat-surface');
  });

  afterEach(() => host.remove());

  it('owns its expanded S/M frame without changing the compact input', async () => {
    const compact = document.createElement('nx-ao-input');
    host.shadowRoot.append(compact);
    await compact.updateComplete;
    expect(compact.shadowRoot.querySelector('.chat-surface')).to.equal(null);
    expect(getComputedStyle(compact.shadowRoot.querySelector('.chat-form')).borderRadius).to.equal('8px');
    expect(frame.getBoundingClientRect().width).to.equal(664);
    expect(frame.getBoundingClientRect().height).to.equal(109);
    expect(getComputedStyle(frame).borderRadius).to.equal('24px');
    expect(getComputedStyle(frame, '::before').borderRadius).to.equal('30px');
    await input.setPrompt('Keep this draft');
    input.size = 'm';
    await input.updateComplete;
    expect(frame.getBoundingClientRect().height).to.equal(123);
    expect(input.shadowRoot.querySelector('.chat-send').getBoundingClientRect().width).to.equal(40);
    expect(input.draft).to.equal('Keep this draft');
    expect(getComputedStyle(frame).padding).to.equal('16px');
  });

  it('retains the ready and working artwork in both themes', async () => {
    for (const scheme of ['light', 'dark']) {
      host.style.colorScheme = scheme;
      input.blocked = false;
      await input.updateComplete;
      expect(getComputedStyle(surface).backgroundImage).to.include('rgba(235, 238, 255, 0.16)');
      expect(getComputedStyle(surface, '::before').opacity).to.equal('0.12');
      expect(getComputedStyle(frame, '::after').opacity).to.equal('0.32');
      input.blocked = true;
      await input.updateComplete;
      expect(getComputedStyle(surface).boxShadow).not.to.equal('none');
      expect(getComputedStyle(frame, '::after').content).to.equal('""');
      expect(getComputedStyle(surface).backgroundImage).to.include('rgba(235, 238, 255, 0.16)');
    }
  });

  it('scales expanded context pills without losing the draft or selection', async () => {
    await input.setPrompt('Keep this draft');
    input.addItem({ id: 'selection', label: 'Selected content' });
    const pills = input.shadowRoot.querySelector('nx-pills');
    await pills.updateComplete;
    expect(getComputedStyle(pills.shadowRoot.querySelector('.pill-label')).fontSize).to.equal('12px');
    input.size = 'm';
    await input.updateComplete;
    await pills.updateComplete;
    expect(getComputedStyle(pills.shadowRoot.querySelector('.pill-label')).fontSize).to.equal('14px');
    expect(input.draft).to.equal('Keep this draft');
    expect(input.items.map((item) => item.id)).to.deep.equal(['selection']);
  });

  it('shows a focus outline across the input shadow boundary in both themes without resizing', async () => {
    for (const scheme of ['light', 'dark']) {
      host.style.colorScheme = scheme;
      input.shadowRoot.querySelector('textarea').blur();
      expect(getComputedStyle(surface).outlineStyle).to.equal('none');
      const { width, height } = frame.getBoundingClientRect();
      await input.focusInput();
      const focused = getComputedStyle(surface);
      expect(focused.outlineStyle).to.equal('solid');
      expect(focused.outlineWidth).to.equal('2px');
      expect(focused.outlineOffset).to.equal('-2px');
      expect(frame.getBoundingClientRect().width).to.equal(width);
      expect(frame.getBoundingClientRect().height).to.equal(height);
    }
  });

  it('keeps focus and drop feedback inside the input', async () => {
    await input.focusInput();
    expect(getComputedStyle(frame, '::before').backdropFilter).to.equal('none');
    expect(getComputedStyle(frame, '::after').content).to.equal('none');
    input._dragging = true;
    await input.updateComplete;
    expect(getComputedStyle(surface).borderTopWidth).to.equal('2px');
    expect(getComputedStyle(surface).borderColor).to.equal('rgb(122, 106, 253)');
    expect(getComputedStyle(surface, '::before').content).to.equal('none');
  });
});
