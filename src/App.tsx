import { HashRouter, Routes, Route } from "react-router-dom";
import SlackOpen from "./pages/SlackOpen";
import PinHeistPuzzle from "./pages/Pins"; 
import SnippetCipher from "./pages/SnippetCipher";
import BookmarksClonePuzzle from "./pages/BookmarksClonePuzzle";
import CRTLoading from "./components/Loading";
import FilesTriage from "./pages/Files";
import SlashSearchAudit from "./pages/Slash";
import SurfaceSwitchboard from "./pages/SwitchBoard";
import AlignGrid from "./pages/Align";
import FinalPromptAssembler from "./pages/Finale";
import LoginPage from "./pages/Password";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SlackOpen />} />
        <Route path="/SlackOpen" element={<SlackOpen />} /> 
        <Route path="/Pins" element={<PinHeistPuzzle />} />
        <Route path="/Snippet" element={<SnippetCipher />} />
        <Route path="/BookmarksClonePuzzle" element={<BookmarksClonePuzzle />} />
        <Route path="/Loading" element={<CRTLoading to="/Password" delayMs={10000} />} />
        <Route path="/Password" element={<LoginPage to="/Files" />} />
        <Route path="/Files" element={<FilesTriage />} />
        <Route path="/Slash" element={<SlashSearchAudit to="/Switchboard" autoRoute />} />
        <Route path="/Switchboard" element={<SurfaceSwitchboard to="/Align" autoRoute />} /> 
        <Route path="/Align" element={<AlignGrid />} />
        <Route path="/Finale" element={<FinalPromptAssembler />} />
      </Routes>
    </HashRouter>
  );
}
