/**
 * Morfeusz2 stub header for compilation
 * This is a minimal stub to allow the bindings to compile without the actual library
 */

#ifndef MORFEUSZ2_H
#define MORFEUSZ2_H

#include <vector>
#include <string>
#include <set>
#include <stdexcept>

namespace morfeusz {

    enum Charset {
        UTF8 = 11,
        ISO8859_2 = 12,
        CP1250 = 13,
        CP852 = 14
    };

    enum TokenNumbering {
        SEPARATE_NUMBERING = 201,
        CONTINUOUS_NUMBERING = 202
    };
    
    enum CaseHandling {
        CONDITIONALLY_CASE_SENSITIVE = 100,
        STRICTLY_CASE_SENSITIVE = 101,
        IGNORE_CASE = 102
    };

    enum WhitespaceHandling {
        SKIP_WHITESPACES = 301,
        APPEND_WHITESPACES = 302,
        KEEP_WHITESPACES = 303
    };
    
    enum MorfeuszUsage {
        ANALYSE_ONLY = 401,
        GENERATE_ONLY = 402,
        BOTH_ANALYSE_AND_GENERATE = 403
    };

    struct MorphInterpretation {
        MorphInterpretation()
        : startNode(0), endNode(0), orth(), lemma(), tagId(0), nameId(0), labelsId(0) {}
        
        static MorphInterpretation createIgn(
                int startNode, int endNode,
                const std::string& orth, const std::string& lemma) {
            MorphInterpretation interp;
            interp.startNode = startNode;
            interp.endNode = endNode;
            interp.orth = orth;
            interp.lemma = lemma;
            interp.tagId = 0;
            return interp;
        }

        static MorphInterpretation createWhitespace(int startNode, int endNode, const std::string& orth) {
            MorphInterpretation interp;
            interp.startNode = startNode;
            interp.endNode = endNode;
            interp.orth = orth;
            interp.lemma = orth;
            interp.tagId = 1;
            return interp;
        }

        inline bool isIgn() const {
            return tagId == 0;
        }

        inline bool isWhitespace() const {
            return tagId == 1;
        }

        int startNode;
        int endNode;
        std::string orth;
        std::string lemma;
        int tagId;
        int nameId;
        int labelsId;
    };

    class IdResolver {
    public:
        virtual const std::string& getTag(int tagId) const = 0;
        virtual int getTagId(const std::string& tag) const = 0;
        virtual const std::string& getName(int nameId) const = 0;
        virtual int getNameId(const std::string& name) const = 0;
        virtual const std::string& getLabelsAsString(int labelsId) const = 0;
        virtual const std::set<std::string>& getLabels(int labelsId) const = 0;
        virtual int getLabelsId(const std::string& labelsStr) const = 0;
        virtual size_t getTagsCount() const = 0;
        virtual size_t getNamesCount() const = 0;
        virtual size_t getLabelsCount() const = 0;
        virtual ~IdResolver() {}
    };

    class Morfeusz {
    public:
        static std::string getVersion() { return "stub-0.1.0"; }
        static std::string getDefaultDictName() { return "stub-dict"; }
        static std::string getCopyright() { return "Stub implementation"; }
        
        static Morfeusz* createInstance(MorfeuszUsage usage=BOTH_ANALYSE_AND_GENERATE);
        static Morfeusz* createInstance(const std::string& dictName, MorfeuszUsage usage=BOTH_ANALYSE_AND_GENERATE);
        
        virtual std::string getDictID() const = 0;
        virtual std::string getDictCopyright() const = 0;
        virtual Morfeusz* clone() const = 0;
        virtual ~Morfeusz() {}

        virtual void analyse(const std::string& text, std::vector<MorphInterpretation>& result) const = 0;
        virtual void generate(const std::string& lemma, std::vector<MorphInterpretation>& result) const = 0;
        virtual void generate(const std::string& lemma, int tagId, std::vector<MorphInterpretation>& result) const = 0;

        virtual void setCharset(Charset encoding) = 0;
        virtual Charset getCharset() const = 0;
        virtual void setAggl(const std::string& aggl) = 0;
        virtual std::string getAggl() const = 0;
        virtual void setPraet(const std::string& praet) = 0;
        virtual std::string getPraet() const = 0;
        virtual void setCaseHandling(CaseHandling caseHandling) = 0;
        virtual CaseHandling getCaseHandling() const = 0;
        virtual void setTokenNumbering(TokenNumbering numbering) = 0;
        virtual TokenNumbering getTokenNumbering() const = 0;
        virtual void setWhitespaceHandling(WhitespaceHandling whitespaceHandling) = 0;
        virtual WhitespaceHandling getWhitespaceHandling() const = 0;
        virtual const IdResolver& getIdResolver() const = 0;
    };

    class MorfeuszException : public std::exception {
    public:
        MorfeuszException(const std::string& what) : msg(what.c_str()) {}
        virtual ~MorfeuszException() throw () {}
        virtual const char* what() const throw () { return this->msg.c_str(); }
    private:
        const std::string msg;
    };

    class FileFormatException : public MorfeuszException {
    public:
        FileFormatException(const std::string& what) : MorfeuszException(what) {}
    };

    // Stub implementation
    class StubIdResolver : public IdResolver {
    private:
        std::string stubTag;
        std::string stubName;
        std::string stubLabels;
        std::set<std::string> stubLabelSet;
        
    public:
        StubIdResolver() : stubTag("subst:sg:nom:m3"), stubName(""), stubLabels("") {
            stubLabelSet.insert("stub");
        }
        
        const std::string& getTag(int tagId) const override { return stubTag; }
        int getTagId(const std::string& tag) const override { return 1; }
        const std::string& getName(int nameId) const override { return stubName; }
        int getNameId(const std::string& name) const override { return 0; }
        const std::string& getLabelsAsString(int labelsId) const override { return stubLabels; }
        const std::set<std::string>& getLabels(int labelsId) const override { return stubLabelSet; }
        int getLabelsId(const std::string& labelsStr) const override { return 0; }
        size_t getTagsCount() const override { return 100; }
        size_t getNamesCount() const override { return 10; }
        size_t getLabelsCount() const override { return 5; }
    };

    class StubMorfeusz : public Morfeusz {
    private:
        Charset charset;
        CaseHandling caseHandling;
        TokenNumbering tokenNumbering;
        WhitespaceHandling whitespaceHandling;
        std::string aggl;
        std::string praet;
        StubIdResolver resolver;
        
    public:
        StubMorfeusz() 
            : charset(UTF8)
            , caseHandling(CONDITIONALLY_CASE_SENSITIVE)
            , tokenNumbering(SEPARATE_NUMBERING)
            , whitespaceHandling(SKIP_WHITESPACES)
            , aggl("permissive")
            , praet("composite")
        {}
        
        std::string getDictID() const override { return "stub-dict-id"; }
        std::string getDictCopyright() const override { return "Stub dictionary"; }
        Morfeusz* clone() const override { return new StubMorfeusz(*this); }
        
        void analyse(const std::string& text, std::vector<MorphInterpretation>& result) const override {
            // Simple stub: create one interpretation per word
            result.clear();
            MorphInterpretation interp;
            interp.startNode = 0;
            interp.endNode = 1;
            interp.orth = text;
            interp.lemma = text;
            interp.tagId = 1;
            interp.nameId = 0;
            interp.labelsId = 0;
            result.push_back(interp);
        }
        
        void generate(const std::string& lemma, std::vector<MorphInterpretation>& result) const override {
            result.clear();
            MorphInterpretation interp;
            interp.startNode = 0;
            interp.endNode = 1;
            interp.orth = lemma;
            interp.lemma = lemma;
            interp.tagId = 1;
            interp.nameId = 0;
            interp.labelsId = 0;
            result.push_back(interp);
        }
        
        void generate(const std::string& lemma, int tagId, std::vector<MorphInterpretation>& result) const override {
            generate(lemma, result);
        }
        
        void setCharset(Charset encoding) override { charset = encoding; }
        Charset getCharset() const override { return charset; }
        void setAggl(const std::string& aggl) override { this->aggl = aggl; }
        std::string getAggl() const override { return aggl; }
        void setPraet(const std::string& praet) override { this->praet = praet; }
        std::string getPraet() const override { return praet; }
        void setCaseHandling(CaseHandling caseHandling) override { this->caseHandling = caseHandling; }
        CaseHandling getCaseHandling() const override { return caseHandling; }
        void setTokenNumbering(TokenNumbering numbering) override { this->tokenNumbering = numbering; }
        TokenNumbering getTokenNumbering() const override { return tokenNumbering; }
        void setWhitespaceHandling(WhitespaceHandling whitespaceHandling) override { 
            this->whitespaceHandling = whitespaceHandling; 
        }
        WhitespaceHandling getWhitespaceHandling() const override { return whitespaceHandling; }
        const IdResolver& getIdResolver() const override { return resolver; }
    };

    inline Morfeusz* Morfeusz::createInstance(MorfeuszUsage usage) {
        return new StubMorfeusz();
    }

    inline Morfeusz* Morfeusz::createInstance(const std::string& dictName, MorfeuszUsage usage) {
        return new StubMorfeusz();
    }
}

#endif // MORFEUSZ2_H
