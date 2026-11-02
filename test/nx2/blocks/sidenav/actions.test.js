import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../../nx2/blocks/sidenav/sidenav.js';

describe('sidenav actions', () => {
  let nav;

  beforeEach(async () => {
    const Sidenav = customElements.get('nx-sidenav');
    sinon.stub(Sidenav.prototype, 'loadNav').callsFake(function loadNav() {
      this._navLinks = [{ text: 'Home', href: `${window.location.origin}/`, icon: '' }];
    });
    nav = document.createElement('nx-sidenav');
    document.body.append(nav);
    await nav.updateComplete;
  });

  afterEach(() => {
    nav.remove();
    sinon.restore();
  });

  it('keeps the existing menu unchanged without host actions', () => {
    expect(nav.shadowRoot.querySelectorAll('.nav-link')).to.have.length(1);
    expect(nav.shadowRoot.querySelector('.nav-action')).to.equal(null);
  });

  it('places an accessible host action before links and respects its disabled state', async () => {
    const onClick = sinon.spy();
    nav.actions = [{ label: 'Open chat', icon: '/assistant.svg', disabled: true, onClick }];
    await nav.updateComplete;
    const button = nav.shadowRoot.querySelector('button');
    expect(nav.shadowRoot.querySelector('li').className).to.equal('nav-action');
    expect(button.getAttribute('aria-label')).to.equal('Open chat');
    button.click();
    expect(onClick.called).to.equal(false);
    nav.actions = [{ ...nav.actions[0], disabled: false }];
    await nav.updateComplete;
    button.click();
    expect(onClick.calledOnce).to.equal(true);
    expect(nav.shadowRoot.querySelectorAll('.nav-link')).to.have.length(1);
    nav.actions = [];
    await nav.updateComplete;
    expect(nav.shadowRoot.querySelector('.nav-action')).to.equal(null);
  });

  it('replaces the built-in chat control only while a host owns its section', async () => {
    nav._chatEnabled = true;
    nav._hasChatPanel = true;
    nav.actions = [{ section: 'chat', label: 'Open chat', icon: '/assistant.svg' }];
    await nav.updateComplete;
    expect(nav.shadowRoot.querySelectorAll('button')).to.have.length(1);
    expect(nav.shadowRoot.querySelector('.nav-action')).not.to.equal(null);
    expect(nav.shadowRoot.querySelectorAll('.nav-link.chat')).to.have.length(1);
    expect(nav.shadowRoot.querySelector('.nav-link.chat'))
      .to.equal(nav.shadowRoot.querySelector('.nav-action'));
    nav.actions = [];
    await nav.updateComplete;
    expect(nav.shadowRoot.querySelectorAll('button')).to.have.length(1);
    expect(nav.shadowRoot.querySelector('.nav-link.chat')).not.to.equal(null);
  });

  it('keeps the host Chat glyph compact and restores its gradient after closing in both themes', async () => {
    nav._chatEnabled = true;
    nav._hasChatPanel = true;
    nav.style.setProperty('--nx-sidenav-action-icon-size', '40px');
    for (const scheme of ['light', 'dark']) {
      nav.style.colorScheme = scheme;
      nav.actions = [{ section: 'chat', label: 'Open chat', active: false }];
      await nav.updateComplete;
      const row = nav.shadowRoot.querySelector('.nav-action.chat');
      const button = row.querySelector('button');
      const badge = row.querySelector('.icon');
      const glyph = badge.querySelector('svg');
      const background = getComputedStyle(badge).backgroundImage;
      expect(nav.shadowRoot.querySelectorAll('.chat')).to.have.length(1);
      expect(row.getBoundingClientRect().height).to.equal(32);
      expect(button.getBoundingClientRect().width).to.equal(32);
      expect(badge.getBoundingClientRect().width).to.equal(32);
      expect(glyph.getBoundingClientRect().width).to.equal(18);
      expect(glyph.getBoundingClientRect().height).to.equal(18);
      expect(glyph.viewBox.baseVal.width).to.equal(20);
      expect(background).to.include('/sidenav/coworker-background.svg');
      const image = new Image();
      const [, href] = background.match(/url\("([^"]+)"\)/);
      image.src = href;
      await image.decode();
      nav.actions = [{ ...nav.actions[0], active: true }];
      await nav.updateComplete;
      expect(getComputedStyle(badge).backgroundImage).to.equal('none');
      expect(glyph.getBoundingClientRect().width).to.equal(18);
      expect(row.getBoundingClientRect().height).to.equal(32);
      nav.actions = [{ ...nav.actions[0], active: false }];
      await nav.updateComplete;
      expect(getComputedStyle(badge).backgroundImage).to.equal(background);
    }
  });

  it('sizes host action graphics through their component property', async () => {
    nav.actions = [{ label: 'Open chat', icon: '/assistant.svg', onClick() {} }];
    await nav.updateComplete;
    const image = nav.shadowRoot.querySelector('.nav-action img');
    expect(image.getBoundingClientRect().width).to.equal(32);
    nav.style.setProperty('--nx-sidenav-action-icon-size', '40px');
    expect(image.getBoundingClientRect().width).to.equal(40);
    expect(image.getBoundingClientRect().height).to.equal(40);
  });

  it('lets SVG artwork overflow and switches to an accessible selected glyph', async () => {
    nav.style.setProperty('--s2-gray-800', 'rgb(41 41 41)');
    nav.style.setProperty('--s2-gray-25', 'rgb(255 255 255)');
    nav.actions = [{
      label: 'Open chat',
      icon: '/assistant.svg#icon',
      activeIcon: '/coworker.svg#icon',
      active: false,
    }];
    await nav.updateComplete;
    const button = nav.shadowRoot.querySelector('button');
    const artwork = button.querySelector('svg');
    button.style.transition = 'none';
    expect(artwork.getBoundingClientRect().width).to.equal(32);
    expect(artwork.getBoundingClientRect().height).to.equal(32);
    expect(getComputedStyle(artwork).overflow).to.equal('visible');
    expect(getComputedStyle(button).overflow).to.equal('visible');
    expect(button.getAttribute('aria-pressed')).to.equal('false');
    nav.actions = [{ ...nav.actions[0], active: true }];
    await nav.updateComplete;
    expect(button.getAttribute('aria-pressed')).to.equal('true');
    expect(button.querySelector('.nav-action-artwork')).to.equal(null);
    expect(button.querySelector('use').getAttribute('href')).to.equal('/coworker.svg#icon');
    expect(button.querySelector('svg').getBoundingClientRect().width).to.equal(18);
    expect(button.getBoundingClientRect().width).to.equal(32);
    expect(button.getBoundingClientRect().height).to.equal(32);
    expect(getComputedStyle(button).borderRadius).to.equal('50%');
    expect(getComputedStyle(button).backgroundColor).to.equal('rgb(41, 41, 41)');
    expect(getComputedStyle(button).color).to.equal('rgb(255, 255, 255)');
    nav.actions = [{ ...nav.actions[0], active: false }];
    await nav.updateComplete;
    expect(button.querySelector('.nav-action-artwork')).not.to.equal(null);
    expect(button.getAttribute('aria-pressed')).to.equal('false');
  });
});
