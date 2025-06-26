import React from 'react';

export class GameErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          Something went wrong. 
          <button onClick={this.props.onReset}>Reset Game</button>
        </div>
      );
    }
    return this.props.children;
  }
}
