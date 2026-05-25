import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../App';

test('learn react 링크를 렌더링한다', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
