export default (element, props) => {
  const clickHandler = (e) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if(!href){
      return;
    }
    history.pushState(null, '', href);
    dispatchEvent(new Event('popstate'));
  }
  element.addEventListener('click', clickHandler);
  return {
    update(parameters){},
    destroy(){element.removeEventListener('click', clickHandler);}
  }
}
