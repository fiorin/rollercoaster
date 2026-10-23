import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error in React tree:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="error-boundary">
        <h2>Algo quebrou</h2>
        <p>
          O app encontrou um erro inesperado e parou de funcionar. Seus dados
          continuam salvos no servidor.
        </p>
        <pre className="error-boundary-detail">{String(error.message || error)}</pre>
        <div className="error-boundary-actions">
          <button type="button" className="primary" onClick={this.handleReset}>
            Tentar novamente
          </button>
          <button type="button" onClick={this.handleReload}>
            Recarregar o app
          </button>
        </div>
      </div>
    );
  }
}
