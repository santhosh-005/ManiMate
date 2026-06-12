# ManiMate

Desktop application for generating AI-powered mathematical animation video clips using Manim.

## Overview

ManiMate is a desktop application that leverages artificial intelligence to streamline the creation of mathematical animation videos. Built on Manim, a powerful mathematical animation engine, ManiMate provides an intuitive interface for educators, content creators, and mathematicians to generate professional-quality mathematical visualizations without extensive animation expertise.

## Features

- AI-assisted video generation for mathematical concepts
- Manim integration for high-quality mathematical animations
- Desktop-based application for offline workflow
- TypeScript-based architecture for type safety and maintainability
- React with Vite for modern UI development
- Real-time preview capabilities

## Technology Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Language Composition**: 
  - TypeScript: 97.9%
  - JavaScript: 1.5%
  - Other: 0.6%

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Python 3.9+ (for Manim)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/santhosh-005/ManiMate.git
cd ManiMate
```

2. Install dependencies:
```bash
npm install
```

3. Install Manim (if not already installed):
```bash
pip install manim
```

## Development

### Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` with Hot Module Replacement (HMR) enabled.

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

## Project Structure

- `src/` - Source code directory
- `public/` - Static assets
- `dist/` - Build output directory
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration

## ESLint Configuration

This project uses ESLint with TypeScript support. The configuration includes:

- Type-aware lint rules for enhanced code quality
- React-specific linting rules
- Stylistic checks for consistency

To extend the ESLint configuration for stricter type checking, refer to the configuration options in `eslint.config.js`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## Dependencies

Key dependencies include:

- React - UI library
- TypeScript - Type safety
- Vite - Build tool and development server
- ESLint - Code quality and style enforcement

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

## Roadmap

- Enhanced AI model integration
- Video export optimization
- Template library for common mathematical concepts
- Real-time rendering improvements
- Extended Manim feature support

## Authors

Created and maintained by [santhosh-005](https://github.com/santhosh-005)

---

For more information about Manim, visit the [official Manim documentation](https://docs.manim.community/).
