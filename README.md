## Everythings Vance

Everythings Vance is a browser extension that swaps the face of VP Vance onto any image.

## Requirements

- [Replicate API Key](https://replicate.com/account/api-tokens) - Required for the face-swapping

### Installation

1. Clone the repository
	```
	git clone git@github.com:puravparab/Everythings-Vance.git
	cd Everythings-Vance
	```

2. Install dependencies
	```
	npm ci
	```

3. Build extension and compress it
	```
	npm run build:zip
	```

4. Load the unpacked extension
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" in the top-right
- Click "Load unpacked" and select the `dist` directory

5. Open the popup and add your [Replicate API key](https://replicate.com/account/api-tokens)

6. Right click on any image, click `Vancify this image` and wait for the swap!