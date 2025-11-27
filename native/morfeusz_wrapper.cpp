#include <napi.h>
#include <morfeusz2.h>
#include <memory>
#include <vector>
#include <set>
#include <string>

using namespace morfeusz;

// Helper to convert MorphInterpretation to JS object
Napi::Object MorphInterpToJS(Napi::Env env, const MorphInterpretation& interp, const Morfeusz* morfeusz) {
    Napi::Object obj = Napi::Object::New(env);
    
    obj.Set("startNode", Napi::Number::New(env, interp.startNode));
    obj.Set("endNode", Napi::Number::New(env, interp.endNode));
    obj.Set("orth", Napi::String::New(env, interp.orth));
    obj.Set("lemma", Napi::String::New(env, interp.lemma));
    obj.Set("tagId", Napi::Number::New(env, interp.tagId));
    obj.Set("nameId", Napi::Number::New(env, interp.nameId));
    obj.Set("labelsId", Napi::Number::New(env, interp.labelsId));
    
    // Add resolved string values
    const IdResolver& resolver = morfeusz->getIdResolver();
    obj.Set("tag", Napi::String::New(env, resolver.getTag(interp.tagId)));
    obj.Set("name", Napi::String::New(env, resolver.getName(interp.nameId)));
    obj.Set("labels", Napi::String::New(env, resolver.getLabelsAsString(interp.labelsId)));
    
    return obj;
}

// IdResolver wrapper class
class IdResolverWrapper : public Napi::ObjectWrap<IdResolverWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    IdResolverWrapper(const Napi::CallbackInfo& info);
    
    void SetResolver(const IdResolver* resolver) { this->resolver = resolver; }
    
private:
    const IdResolver* resolver;
    
    Napi::Value GetTag(const Napi::CallbackInfo& info);
    Napi::Value GetTagId(const Napi::CallbackInfo& info);
    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetNameId(const Napi::CallbackInfo& info);
    Napi::Value GetLabelsAsString(const Napi::CallbackInfo& info);
    Napi::Value GetLabels(const Napi::CallbackInfo& info);
    Napi::Value GetLabelsId(const Napi::CallbackInfo& info);
    Napi::Value GetTagsCount(const Napi::CallbackInfo& info);
    Napi::Value GetNamesCount(const Napi::CallbackInfo& info);
    Napi::Value GetLabelsCount(const Napi::CallbackInfo& info);
};

Napi::Object IdResolverWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "IdResolver", {
        InstanceMethod("getTag", &IdResolverWrapper::GetTag),
        InstanceMethod("getTagId", &IdResolverWrapper::GetTagId),
        InstanceMethod("getName", &IdResolverWrapper::GetName),
        InstanceMethod("getNameId", &IdResolverWrapper::GetNameId),
        InstanceMethod("getLabelsAsString", &IdResolverWrapper::GetLabelsAsString),
        InstanceMethod("getLabels", &IdResolverWrapper::GetLabels),
        InstanceMethod("getLabelsId", &IdResolverWrapper::GetLabelsId),
        InstanceMethod("getTagsCount", &IdResolverWrapper::GetTagsCount),
        InstanceMethod("getNamesCount", &IdResolverWrapper::GetNamesCount),
        InstanceMethod("getLabelsCount", &IdResolverWrapper::GetLabelsCount)
    });
    
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);
    
    return exports;
}

IdResolverWrapper::IdResolverWrapper(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<IdResolverWrapper>(info), resolver(nullptr) {
}

Napi::Value IdResolverWrapper::GetTag(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int tagId = info[0].As<Napi::Number>().Int32Value();
    try {
        return Napi::String::New(env, resolver->getTag(tagId));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IdResolverWrapper::GetTagId(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string tag = info[0].As<Napi::String>().Utf8Value();
    try {
        return Napi::Number::New(env, resolver->getTagId(tag));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IdResolverWrapper::GetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int nameId = info[0].As<Napi::Number>().Int32Value();
    try {
        return Napi::String::New(env, resolver->getName(nameId));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IdResolverWrapper::GetNameId(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string name = info[0].As<Napi::String>().Utf8Value();
    try {
        return Napi::Number::New(env, resolver->getNameId(name));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IdResolverWrapper::GetLabelsAsString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int labelsId = info[0].As<Napi::Number>().Int32Value();
    try {
        return Napi::String::New(env, resolver->getLabelsAsString(labelsId));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IdResolverWrapper::GetLabels(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int labelsId = info[0].As<Napi::Number>().Int32Value();
    try {
        const std::set<std::string>& labels = resolver->getLabels(labelsId);
        Napi::Array arr = Napi::Array::New(env, labels.size());
        int i = 0;
        for (const auto& label : labels) {
            arr[i++] = Napi::String::New(env, label);
        }
        return arr;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IdResolverWrapper::GetLabelsId(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string labelsStr = info[0].As<Napi::String>().Utf8Value();
    try {
        return Napi::Number::New(env, resolver->getLabelsId(labelsStr));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IdResolverWrapper::GetTagsCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::Number::New(env, resolver->getTagsCount());
}

Napi::Value IdResolverWrapper::GetNamesCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::Number::New(env, resolver->getNamesCount());
}

Napi::Value IdResolverWrapper::GetLabelsCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!resolver) {
        Napi::TypeError::New(env, "Resolver not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::Number::New(env, resolver->getLabelsCount());
}

// Morfeusz instance wrapper class
class MorfeuszInstanceWrapper : public Napi::ObjectWrap<MorfeuszInstanceWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    MorfeuszInstanceWrapper(const Napi::CallbackInfo& info);
    ~MorfeuszInstanceWrapper();
    
    void SetInstance(Morfeusz* instance) { this->morfeusz = instance; }
    
private:
    Morfeusz* morfeusz;
    
    Napi::Value GetDictID(const Napi::CallbackInfo& info);
    Napi::Value GetDictCopyright(const Napi::CallbackInfo& info);
    Napi::Value Analyse(const Napi::CallbackInfo& info);
    Napi::Value Generate(const Napi::CallbackInfo& info);
    Napi::Value GenerateWithTag(const Napi::CallbackInfo& info);
    Napi::Value SetCharset(const Napi::CallbackInfo& info);
    Napi::Value GetCharset(const Napi::CallbackInfo& info);
    Napi::Value SetAggl(const Napi::CallbackInfo& info);
    Napi::Value GetAggl(const Napi::CallbackInfo& info);
    Napi::Value SetPraet(const Napi::CallbackInfo& info);
    Napi::Value GetPraet(const Napi::CallbackInfo& info);
    Napi::Value SetCaseHandling(const Napi::CallbackInfo& info);
    Napi::Value GetCaseHandling(const Napi::CallbackInfo& info);
    Napi::Value SetTokenNumbering(const Napi::CallbackInfo& info);
    Napi::Value GetTokenNumbering(const Napi::CallbackInfo& info);
    Napi::Value SetWhitespaceHandling(const Napi::CallbackInfo& info);
    Napi::Value GetWhitespaceHandling(const Napi::CallbackInfo& info);
    Napi::Value GetIdResolver(const Napi::CallbackInfo& info);
};

Napi::Object MorfeuszInstanceWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "MorfeuszInstance", {
        InstanceMethod("getDictID", &MorfeuszInstanceWrapper::GetDictID),
        InstanceMethod("getDictCopyright", &MorfeuszInstanceWrapper::GetDictCopyright),
        InstanceMethod("analyse", &MorfeuszInstanceWrapper::Analyse),
        InstanceMethod("generate", &MorfeuszInstanceWrapper::Generate),
        InstanceMethod("generateWithTag", &MorfeuszInstanceWrapper::GenerateWithTag),
        InstanceMethod("setCharset", &MorfeuszInstanceWrapper::SetCharset),
        InstanceMethod("getCharset", &MorfeuszInstanceWrapper::GetCharset),
        InstanceMethod("setAggl", &MorfeuszInstanceWrapper::SetAggl),
        InstanceMethod("getAggl", &MorfeuszInstanceWrapper::GetAggl),
        InstanceMethod("setPraet", &MorfeuszInstanceWrapper::SetPraet),
        InstanceMethod("getPraet", &MorfeuszInstanceWrapper::GetPraet),
        InstanceMethod("setCaseHandling", &MorfeuszInstanceWrapper::SetCaseHandling),
        InstanceMethod("getCaseHandling", &MorfeuszInstanceWrapper::GetCaseHandling),
        InstanceMethod("setTokenNumbering", &MorfeuszInstanceWrapper::SetTokenNumbering),
        InstanceMethod("getTokenNumbering", &MorfeuszInstanceWrapper::GetTokenNumbering),
        InstanceMethod("setWhitespaceHandling", &MorfeuszInstanceWrapper::SetWhitespaceHandling),
        InstanceMethod("getWhitespaceHandling", &MorfeuszInstanceWrapper::GetWhitespaceHandling),
        InstanceMethod("getIdResolver", &MorfeuszInstanceWrapper::GetIdResolver)
    });
    
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);
    
    return exports;
}

MorfeuszInstanceWrapper::MorfeuszInstanceWrapper(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<MorfeuszInstanceWrapper>(info), morfeusz(nullptr) {
}

MorfeuszInstanceWrapper::~MorfeuszInstanceWrapper() {
    if (morfeusz) {
        delete morfeusz;
        morfeusz = nullptr;
    }
}

Napi::Value MorfeuszInstanceWrapper::GetDictID(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::String::New(env, morfeusz->getDictID());
}

Napi::Value MorfeuszInstanceWrapper::GetDictCopyright(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::String::New(env, morfeusz->getDictCopyright());
}

Napi::Value MorfeuszInstanceWrapper::Analyse(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::vector<MorphInterpretation> results;
    
    try {
        morfeusz->analyse(text, results);
        
        Napi::Array arr = Napi::Array::New(env, results.size());
        for (size_t i = 0; i < results.size(); i++) {
            arr[i] = MorphInterpToJS(env, results[i], morfeusz);
        }
        return arr;
    } catch (const MorfeuszException& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value MorfeuszInstanceWrapper::Generate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string lemma = info[0].As<Napi::String>().Utf8Value();
    std::vector<MorphInterpretation> results;
    
    try {
        morfeusz->generate(lemma, results);
        
        Napi::Array arr = Napi::Array::New(env, results.size());
        for (size_t i = 0; i < results.size(); i++) {
            arr[i] = MorphInterpToJS(env, results[i], morfeusz);
        }
        return arr;
    } catch (const MorfeuszException& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value MorfeuszInstanceWrapper::GenerateWithTag(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string lemma = info[0].As<Napi::String>().Utf8Value();
    int tagId = info[1].As<Napi::Number>().Int32Value();
    std::vector<MorphInterpretation> results;
    
    try {
        morfeusz->generate(lemma, tagId, results);
        
        Napi::Array arr = Napi::Array::New(env, results.size());
        for (size_t i = 0; i < results.size(); i++) {
            arr[i] = MorphInterpToJS(env, results[i], morfeusz);
        }
        return arr;
    } catch (const MorfeuszException& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value MorfeuszInstanceWrapper::SetCharset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int charset = info[0].As<Napi::Number>().Int32Value();
    morfeusz->setCharset(static_cast<Charset>(charset));
    return env.Undefined();
}

Napi::Value MorfeuszInstanceWrapper::GetCharset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::Number::New(env, morfeusz->getCharset());
}

Napi::Value MorfeuszInstanceWrapper::SetAggl(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string aggl = info[0].As<Napi::String>().Utf8Value();
    try {
        morfeusz->setAggl(aggl);
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value MorfeuszInstanceWrapper::GetAggl(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::String::New(env, morfeusz->getAggl());
}

Napi::Value MorfeuszInstanceWrapper::SetPraet(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string praet = info[0].As<Napi::String>().Utf8Value();
    try {
        morfeusz->setPraet(praet);
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value MorfeuszInstanceWrapper::GetPraet(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::String::New(env, morfeusz->getPraet());
}

Napi::Value MorfeuszInstanceWrapper::SetCaseHandling(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int caseHandling = info[0].As<Napi::Number>().Int32Value();
    morfeusz->setCaseHandling(static_cast<CaseHandling>(caseHandling));
    return env.Undefined();
}

Napi::Value MorfeuszInstanceWrapper::GetCaseHandling(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::Number::New(env, morfeusz->getCaseHandling());
}

Napi::Value MorfeuszInstanceWrapper::SetTokenNumbering(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int numbering = info[0].As<Napi::Number>().Int32Value();
    morfeusz->setTokenNumbering(static_cast<TokenNumbering>(numbering));
    return env.Undefined();
}

Napi::Value MorfeuszInstanceWrapper::GetTokenNumbering(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::Number::New(env, morfeusz->getTokenNumbering());
}

Napi::Value MorfeuszInstanceWrapper::SetWhitespaceHandling(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int whitespaceHandling = info[0].As<Napi::Number>().Int32Value();
    morfeusz->setWhitespaceHandling(static_cast<WhitespaceHandling>(whitespaceHandling));
    return env.Undefined();
}

Napi::Value MorfeuszInstanceWrapper::GetWhitespaceHandling(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    return Napi::Number::New(env, morfeusz->getWhitespaceHandling());
}

Napi::Value MorfeuszInstanceWrapper::GetIdResolver(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!morfeusz) {
        Napi::TypeError::New(env, "Morfeusz instance not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::FunctionReference* constructor = env.GetInstanceData<Napi::FunctionReference>();
    Napi::Object resolverObj = constructor->New({});
    IdResolverWrapper* wrapper = IdResolverWrapper::Unwrap(resolverObj);
    wrapper->SetResolver(&morfeusz->getIdResolver());
    
    return resolverObj;
}

// Static methods
Napi::Value GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, Morfeusz::getVersion());
}

Napi::Value GetDefaultDictName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, Morfeusz::getDefaultDictName());
}

Napi::Value GetCopyright(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, Morfeusz::getCopyright());
}

Napi::Value CreateInstance(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    MorfeuszUsage usage = BOTH_ANALYSE_AND_GENERATE;
    if (info.Length() > 0 && info[0].IsNumber()) {
        usage = static_cast<MorfeuszUsage>(info[0].As<Napi::Number>().Int32Value());
    }
    
    try {
        Morfeusz* morfeusz = Morfeusz::createInstance(usage);
        
        Napi::FunctionReference* constructor = env.GetInstanceData<Napi::FunctionReference>();
        Napi::Object instanceObj = constructor->New({});
        MorfeuszInstanceWrapper* wrapper = MorfeuszInstanceWrapper::Unwrap(instanceObj);
        wrapper->SetInstance(morfeusz);
        
        return instanceObj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CreateInstanceWithDict(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    std::string dictName = info[0].As<Napi::String>().Utf8Value();
    MorfeuszUsage usage = BOTH_ANALYSE_AND_GENERATE;
    if (info.Length() > 1 && info[1].IsNumber()) {
        usage = static_cast<MorfeuszUsage>(info[1].As<Napi::Number>().Int32Value());
    }
    
    try {
        Morfeusz* morfeusz = Morfeusz::createInstance(dictName, usage);
        
        Napi::FunctionReference* constructor = env.GetInstanceData<Napi::FunctionReference>();
        Napi::Object instanceObj = constructor->New({});
        MorfeuszInstanceWrapper* wrapper = MorfeuszInstanceWrapper::Unwrap(instanceObj);
        wrapper->SetInstance(morfeusz);
        
        return instanceObj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Initialize wrapper classes
    IdResolverWrapper::Init(env, exports);
    MorfeuszInstanceWrapper::Init(env, exports);
    
    // Export static methods
    exports.Set("getVersion", Napi::Function::New(env, GetVersion));
    exports.Set("getDefaultDictName", Napi::Function::New(env, GetDefaultDictName));
    exports.Set("getCopyright", Napi::Function::New(env, GetCopyright));
    exports.Set("createInstance", Napi::Function::New(env, CreateInstance));
    exports.Set("createInstanceWithDict", Napi::Function::New(env, CreateInstanceWithDict));
    
    return exports;
}

NODE_API_MODULE(morfeusz2, Init)
