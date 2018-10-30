import React from 'react';

export function GarnettApp(props) {
  const { title, value, goTo } = props;
  return (
    <div className="app-icon" onClick={goTo}>
      <div className="app-icon-image-container">
        <img 
          className="app-icon-image"
          src={require(`../images/${value}.png`)}
          alt={title}
        />
      </div>
      <p> {title} </p>
    </div>
  )
}