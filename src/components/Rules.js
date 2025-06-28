import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-darkBackground text-lightText p-lg">
      <div className="max-w-4xl mx-auto py-md">
        <h1 className="text-4xl font-bold mb-lg text-center text-primary">Tonk Game Rules</h1>
        
        <div className="bg-gray-800 rounded-lg p-lg mb-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-md text-accentGold">Game Overview</h2>
          <p className="text-gray-300 mb-md">
            Reem Team Tonk is a competitive, real-money multiplayer card game played with a 40-card deck (standard deck minus 8s, 9s, and 10s). The goal is to minimize the points in your hand by creating spreads (sets of 3 or more of a kind or runs) and dropping your hand when ready.
          </p>
          <div className="flex items-center justify-center my-lg">
            <img
              src="https://images.unsplash.com/photo-1620486814211-0b57a4e02155?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxwbGF5aW5nJTIwY2FyZHMlMjBnYW1lJTIwdGFibGUlMjBmZWx0JTIwY2FzaW5vfGVufDB8fHx8MTc0OTY1MTIyMXww&ixlib=rb-4.1.0&fit=fillmax&h=600&w=800"
              alt="Cards on a game table"
              className="rounded-lg max-w-full max-h-64 shadow-md"
            />
          </div>
        </div>
        
        <div className="space-y-lg">
          <div className="bg-gray-800 rounded-lg p-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-md text-accentGold">Card Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <h3 className="font-medium mb-sm text-primary">Number Cards</h3>
                <ul className="text-gray-300 space-y-xs">
                  <li><span className="text-primary">•</span> Ace: 1 point</li>
                  <li><span className="text-primary">•</span> 2 through 7: Face value points</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-sm text-primary">Face Cards</h3>
                <ul className="text-gray-300 space-y-xs">
                  <li><span className="text-primary">•</span> Jack (J): 10 points</li>
                  <li><span className="text-primary">•</span> Queen (Q): 10 points</li>
                  <li><span className="text-primary">•</span> King (K): 10 points</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-md text-accentGold">Special Payouts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <div className="bg-gray-700 border border-primary rounded-lg p-md text-center">
                <h3 className="font-medium mb-sm text-primary">Deal 50</h3>
                <p className="text-gray-300 text-sm">
                  If you're dealt exactly 50 points in your initial hand, you receive a double payout.
                </p>
              </div>
              <div className="bg-gray-700 border border-primary rounded-lg p-md text-center">
                <h3 className="font-medium mb-sm text-primary">41 on First Turn</h3>
                <p className="text-gray-300 text-sm">
                  If you have exactly 41 points after your first turn, you receive a triple payout.
                </p>
              </div>
              <div className="bg-gray-700 border border-primary rounded-lg p-md text-center">
                <h3 className="font-medium mb-sm text-primary">11 and Under</h3>
                <p className="text-gray-300 text-sm">
                  If you drop with 11 points or fewer in your hand, you receive a triple payout.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-md text-accentGold">Penalties</h2>
            <p className="text-gray-300 mb-md">
              Hitting an opponent's spread or your own spread will invoke a penalty that prevents whoever's spread was hit from dropping for a specified number of turns:
            </p>
            <ul className="text-gray-300 space-y-sm">
              <li className="flex items-start">
                <span className="mr-sm text-primary">•</span>
                <span>First hit: 2-turn penalty (cannot drop for 2 turns)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-sm text-primary">•</span>
                <span>Additional hits: +1 turn penalty for each subsequent hit</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-md text-accentGold">Game Flow</h2>
            <ol className="text-gray-300 space-y-md">
              <li className="flex items-start">
                <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white mr-md flex-shrink-0 font-bold">1</span>
                <span>Each player is dealt 5 cards from the 40-card deck.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white mr-md flex-shrink-0 font-bold">2</span>
                <span>On your turn, draw a card from the deck or the discard pile.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white mr-md flex-shrink-0 font-bold">3</span>
                <span>Organize your hand into valid spreads (sets of 3+ same rank or consecutive cards of same suit).</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white mr-md flex-shrink-0 font-bold">4</span>
                <span>Discard one card to end your turn.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white mr-md flex-shrink-0 font-bold">5</span>
                <span>When ready (and if not under penalty), drop your hand to show your final score.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white mr-md flex-shrink-0 font-bold">6</span>
                <span>The player with the lowest point total wins the pot.</span>
              </li>
            </ol>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-md text-accentGold">Tables and Stakes</h2>
            <p className="text-gray-300 mb-md">
              Reem Team offers tables with various stake amounts:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-md">
              <div className="bg-gray-700 rounded-lg p-md text-center border border-borderColor">
                <span className="text-lg font-bold text-primary">$1</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-md text-center border border-borderColor">
                <span className="text-lg font-bold text-primary">$5</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-md text-center border border-borderColor">
                <span className="text-lg font-bold text-primary">$10</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-md text-center border border-borderColor">
                <span className="text-lg font-bold text-primary">$20</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-md text-center border border-borderColor">
                <span className="text-lg font-bold text-primary">$50</span>
              </div>
            </div>
            <p className="text-gray-300">
              Each table supports up to 4 players. Empty seats are filled with AI players until human players join.
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-md text-accentGold">Cash Out System</h2>
            <p className="text-gray-300 mb-md">
              Winners can withdraw their earnings via CashApp:
            </p>
            <ul className="text-gray-300 space-y-sm">
              <li className="flex items-start">
                <span className="mr-sm text-primary">•</span>
                <span>Submit a withdrawal request with your CashApp tag</span>
              </li>
              <li className="flex items-start">
                <span className="mr-sm text-primary">•</span>
                <span>Requests are processed and sent within 1 hour</span>
              </li>
              <li className="flex items-start">
                <span className="mr-sm text-primary">•</span>
                <span>Minimum withdrawal amount: $10</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-lg text-center">
          <Link to="/lobby" className="bg-primary text-lightText px-lg py-md rounded-md text-lg font-semibold hover:bg-buttonHover transition-colors duration-200 shadow-lg inline-flex items-center">
            Ready to Play? Join a Game <ChevronRight className="ml-sm h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
 