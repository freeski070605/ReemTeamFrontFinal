const CasinoChip = () => {
    return (
      <svg width="24" height="24" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        {/* Outer ring with gradient */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#FFD700'}} />
            <stop offset="50%" style={{stopColor: '#DAA520'}} />
            <stop offset="100%" style={{stopColor: '#B8860B'}} />
          </linearGradient>
          <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main coin body */}
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="url(#goldGradient)" 
          stroke="#B8860B" 
          strokeWidth="4"
          filter="url(#coinShadow)"
        />

        {/* Inner design elements */}
        <circle 
          cx="100" 
          cy="100" 
          r="75" 
          fill="none" 
          stroke="#FFD700" 
          strokeWidth="2"
        />

        {/* Decorative elements */}
        <path 
          d="M50,100 A50,50 0 0,1 150,100" 
          fill="none" 
          stroke="#B8860B" 
          strokeWidth="2"
        />
        <path 
          d="M50,100 A50,50 0 0,0 150,100" 
          fill="none" 
          stroke="#B8860B" 
          strokeWidth="2"
        />

        {/* Value text */}
        <text 
          x="50%" 
          y="50%" 
          fontSize="32" 
          fontWeight="bold" 
          textAnchor="middle" 
          fill="#704214" 
          dy=".1em"
          filter="url(#coinShadow)"
        >
          ₵
        </text>
      </svg>
    );
};

export default CasinoChip;
