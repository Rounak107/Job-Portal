import React from 'react';

const AdBanner = () => {
    const adCode = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '102663a5bc15eed35413d9086fe3244f',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/102663a5bc15eed35413d9086fe3244f/invoke.js"></script>
      </body>
    </html>
  `;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0', overflow: 'hidden' }}>
            <iframe
                title="Advertisement"
                srcDoc={adCode}
                width="730" // Slightly larger to avoid scrollbars
                height="92" // Slightly larger to avoid scrollbars
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
            />
        </div>
    );
};

export default AdBanner;
